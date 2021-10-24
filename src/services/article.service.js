const httpStatus = require('http-status');
const _ = require('lodash');
const { Article } = require('../models');
const ApiError = require('../utils/ApiError');
const { tagService } = require('./tag.service');
const { equityService } = require('./equity.service');
const { Tag, Equity } = require('../models');
const clean = require('../utils/clean');
const getDomain = require('../utils/getDomain');
const articleValidator = require('../validations/article.validation');

const getValidatedTags = async (tagList) =>{
  return Tag.getValidatedTags(tagList);
}

const validateArticleBody = async (articleBody) =>{
  const schema = articleValidator.createArticle.body;
  const value = await schema.validateAsync(articleBody);
  return value;
}


const getIfExist = async ({
  title="",
  link="",
  pageLink="",
  nDays=365,
  limit=1,
  uniqCheck=['link','title']
}) => {
  const checkTitle = _.includes(uniqCheck,'title')?clean(title).toLowerCase():null;
  const checkLink = _.includes(uniqCheck,'link')?link:null;
  if(!checkLink && !checkTitle) return true;
  let condition = {};
  if(checkTitle && checkLink){
    condition = {"$or":[{sTitle:checkTitle},{link:checkLink}]}
  } else if(checkTitle){
    condition = {sTitle:checkTitle}
  } else if(checkLink){
    condition = {link:checkLink}
  }
  let qDate = new Date(new Date().getTime()-nDays*24*60*60*1000);
  condition.retrieveDate = {"$gte":qDate};
  console.log(condition);
  const articles = await Article.find(condition).sort({retrieveDate:-1}).limit(limit);
  console.log("Existing Articles",articles);
  //check if domain of both articles are same
  let found = null;
  const domain = getDomain(link || pageLink);
  if(articles && articles.length){
    found = domain?null:articles[0];
    articles.map((article) => {
      if(domain && article.sourceDomain && domain===article.sourceDomain){
        console.log("Domain matched for retrieved article")
        found = article;
      }
    });
  }
  return found;
}

const populateArticle = async (article,updateBody) => {
  const fields = ['title','shortText','fullText','pubDate','pubDateRaw'];
  const extra={};
  fields.map((field)=>{
    if(!article[field] && updateBody[field]){
      extra[field] = updateBody[field];
    }
  });
  if(updateBody.topics && 
    updateBody.topics.length &&
    _.difference(updateBody.topics,article.topics || []).length
  ){
    article.topics = article.topics || [];
    extra.topics = _.uniq([...article.topics,...updateBody.topics]);
  }
  if(updateBody.sources && updateBody.sources.length && _.difference(updateBody.sources,article.sources || []).length){
    extra.sources = _.uniq([...article.sources,...updateBody.sources]);
  }
  if(Object.keys(extra).length){
    console.log("Populating data in db");
    extra.isPartial=false;
    Object.assign(article,extra)
    await article.save();
  }
  return article;
}

/**
 * Create a article
 * @param {Object} articleBody
 * @returns {Promise<Article>}
 */
const createArticle = async (body,options={}) => {
  const {
    uniqCheck=['title','link'],  //title,link,all
    skipValidation=false,
    triggerTagSearch=false,
    triggerTagAdded=true,
  } = options;
  let isNew = true;
  //strip tags from body to handle seaparately
  const {tags,...articleBody} = body;
  if(!skipValidation){
    await validateArticleBody(articleBody);
  }
  let article = await getIfExist({
    title: articleBody.title,
    link: articleBody.link,
    pageLink: articleBody.pageLink,
    limit:5,
    nDays:90,
    uniqCheck
  });
  if(article && (
      !article.isPartial || 
      !articleBody.sources ||
      !articleBody.sources.length,
      !_.difference(articleBody.sources,article.sources || []).length ||
      article.feed.toString() === articleBody.feed.toString()
    )
  ){
    isNew = false;
    console.log("Duplicate found. Skipping")
    return {article,isNew};
  }

  if(article){
    console.log("Duplicate found. Populating")
    isNew = false;
    if(populatePartial && article.isPartial){
      article = await populateArticle(article,articleBody)
    }
  }
  else{
    //populate source
    console.log("Creating New article")
    article = await Article.create(articleBody);
  }
  if(tags && tags.length && _.difference(tags,article.tags || []).length){
    console.log("New Tags Found Calling tagAdded",_.difference(tags,article.tags || []))
    article.tags = await addArticleTag(article.id,tags,{triggerTagAdded})
  }
  return {article,isNew};
};

const createManyArticles = async (articles,options={}) => {
  const result = await Promise.allSettled(articles.map((article)=>{
    return createArticle(article,options);
  }));
  let createdCount=0, duplicateCount=0, errorCount=0, totalCount=0;
  let errors = [];
  result.map(({status,value,reason})=>{
    totalCount += 1;
    if(status==="fulfilled"){
      if(value.isNew){ createdCount+=1}
      else{ duplicateCount+=1};
    }
    else{
      errorCount += 1;
      errors.push(`${reason}`);
    }
  });
  return {totalCount,createdCount,duplicateCount,errorCount,error:errors.join('\n')};
}

/**
 * Query for articles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryArticles = async (filter, options) => {
  const articles = await Article.paginate(filter, options);
  return articles;
};

/**
 * Get article by id
 * @param {ObjectId} id
 * @returns {Promise<Article>}
 */
const getArticleById = async (id,options) => {
  const {raise=false} = options;
  const article = Article.findById(id);
  if(!article && raise){
    throw new ApiError(httpStatus.NOT_FOUND, 'Article not found');
  }
  return article;
};

/**
 * Get article by email
 * @param {string} email
 * @returns {Promise<Article>}
 */
const getArticleByEmail = async (email) => {
  return Article.findOne({ email });
};

/**
 * Update article by id
 * @param {ObjectId} articleId
 * @param {Object} updateBody
 * @returns {Promise<Article>}
 */
const updateArticleById = async (articleId, updateBody) => {
  const article = await getArticleById(articleId,{raise:true});
  Object.assign(article, updateBody);
  await article.save();
  return article;
};

/**
 * Delete article by id
 * @param {ObjectId} articleId
 * @returns {Promise<Article>}
 */
const deleteArticleById = async (articleId) => {
  const article = await getArticleById(articleId,{raise:true});
  await article.remove();
  return article;
};

const addArticleTag = async (articleId,tags,options) => {
  const {
    triggerTagAdded = false,
  } = options;
  if(!tags || !tags.length) return []; 
  if(_.isString(tags)) tags = [tags];
  const article = await getArticleById(articleId,{raise:true});
  const validTags = await getValidatedTags(tags);
  console.log("Valid Tags",validTags);
  const newTags = _.difference(validTags,article.tags || []);
  const result = await Article.updateOne({_id:articleId},{$addToSet:{tags:{$each:newTags}}});
  return newTags;
}
const removeArticleTag = async (articleId,tags,options) => {
  const {
    triggerTagRemoved = false,
  } = options;
  if(!tags || !tags.length) return []; 
  if(_.isString(tags)) tags = [tags];
  const article = await getArticleById(articleId,{raise:true});
  const validTags = await getValidatedTags(tags);
  const removeTags = _.intersection(validTags,article.tags || []);
  const result = await Article.updateOne({_id:articleId},{$pull:{tags:{$in:removeTags}}});
  return removeTags;
}

module.exports = {
  createArticle,
  queryArticles,
  getArticleById,
  getIfExist,
  updateArticleById,
  deleteArticleById,
  createManyArticles,
};

