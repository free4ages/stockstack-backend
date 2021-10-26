const logger = require('../config/logger');
const httpStatus = require('http-status');
const _ = require('lodash');
const pubsub = require('../pubsub');

const ApiError = require('../utils/ApiError');
const clean = require('../utils/clean');
const {hasWord} = require('../utils/wordSearch')
const getDomain = require('../utils/getDomain');

const { Article } = require('../models');
const tagService = require('./tag.service');
const { Tag } = require('../models');
const articleValidator = require('../validations/article.validation');
//Push Triggers

const pushSearchTag = async (articleId) => {
  pubsub.push('article.search_tag',{articleId});
}

//Main Methods

/**
 * Convert articleId to Article
 * @param {ObjectId|Article} articleId
 * @returns {Promise<Article>}
 */
const getArticleInstance = async (articleId,options) => {
  if(!(articleId instanceof Article)){
    return await getArticleById(articleId,options);
  }
  return articleId;
};

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
  const checkTitle = _.includes(uniqCheck,'title')?clean(title,{stripHtml:true,lowercase:true}):null;
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
  //console.log(condition);
  const articles = await Article.find(condition).sort({retrieveDate:-1}).limit(limit);
  //console.log("Existing Articles",articles);
  //check if domain of both articles are same
  let found = null;
  const domain = getDomain(link || pageLink);
  if(articles && articles.length){
    found = domain?null:articles[0];
    articles.map((article) => {
      if(domain && article.sourceDomain && domain===article.sourceDomain){
        logger.debug("Domain matched for retrieved article")
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
    logger.debug("Populating data in db");
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
    doSearchTag=true,
    doSendToFeed=true,
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
    logger.debug("Duplicate found. Skipping")
    return {article,isNew};
  }

  if(article){
    logger.debug("Duplicate found. Populating")
    isNew = false;
    if(populatePartial && article.isPartial){
      article = await populateArticle(article,articleBody)
    }
  }
  else{
    //populate source
    logger.debug("Creating New article")
    article = await Article.create(articleBody);
  }
  if(tags && tags.length && _.difference(tags,article.tags || []).length){
    console.log("New Tags Found Calling tagAdded",_.difference(tags,article.tags || []))
    await addArticleTagsByTagName(article.id,tags,{doSendToFeed})
  }
  if(isNew && doSearchTag){
    await pushSearchTag(article.id);
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

const searchArticles = async (query,filter={},options={}) => {
  if(query){
    filter.$text = {$search:query};
  }
  const articles = await Article.paginate(filter, options);
  return articles;
}

/**
 * Get article by id
 * @param {ObjectId} id
 * @returns {Promise<Article>}
 */
const getArticleById = async (id,options={}) => {
  const {raise=false} = options;
  const article = Article.findById(id);
  if(!article && raise){
    throw new ApiError(httpStatus.NOT_FOUND, 'Article not found');
  }
  return article;
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

/**
 * Add Tags of an article
 * @param {Article|ObjectId} article
 * @param {[Tag]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const addArticleTags = async (article,tags,options={}) => {
  const {
    doSendToFeed = true,
  } = options;

  if(!tags || !tags.length) return []; 
  if(!tags[0] instanceof Tag){
    throw new ApiError(httpStatus.NOT_FOUND, 'article.addArticleTags expects tags instance. Invalid type found');
  }
  article = await getArticleInstance(article,{raise:true});

  //Get new tags
  const tagNames = tags.map(tag => tag.name);
  console.log("Valid Tags",tagNames);
  const newTagNames = _.difference(tagNames,article.tags || []);

  //Update new tags found in db
  const result = await Article.updateOne({_id:article._id},{$addToSet:{tags:{$each:newTagNames}}});
  const newTags = newTagNames.map((newTagName) => _.find(tags,{name:newTagName}))
  //Update the date of article addition in tag
  if(result.modifiedCount){
    await tagService.updateArticleAdded(newTags.map(newTag=> newTag._id));
  }
  return newTags;
};


/**
 * Add Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[ObjectId]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const addArticleTagsByTagId = async (article,tags,options) => {
  if(_.isString(tags)) tags=[tags];
  tags = await tagService.getManyTagById(tags);
  return addArticleTags(article,tags,options);
};

/**
 * Add Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[string]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const addArticleTagsByTagName = async (article,tags,options) => {
  if(_.isString(tags)) tags=[tags];
  tags = await tagService.getManyTagByName(tags);
  return addArticleTags(article,tags,options);
};


/**
 * Remove Tags of an article
 * @param {Article|ObjectId} article
 * @param {[Tag]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const removeArticleTags = async (article,tags,options) => {
  const {
    triggerTagRemoved = false,
  } = options;

  if(!tags || !tags.length) return []; 
  if(!tags[0] instanceof Tag){
    throw new ApiError(httpStatus.NOT_FOUND, 'article.addArticleTags expects tags instance. Invalid type found');
  }
  article = await getArticleInstance(article,{raise:true});

  const tagNames = tags.map(tag => tag.name);
  const removeTagNames = _.intersection(tagNames,article.tags || []);

  const result = await Article.updateOne({_id:articleId},{$pull:{tags:{$in:removeTagNames}}});

  const removeTags = removeTagNames.map((removeTagName) => _.find(tags,{name:removeTagName}))
  return removeTags;
}

/**
 * Remove Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[ObjectId]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const removeArticleTagsByTagId = async (article,tags,options) => {
  if(_.isString(tags)) tags=[tags];
  tags = await tagService.getManyTagById(tags);
  return removeArticleTags(article,tags,options);
};

/**
 * Remove Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[string]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const removeArticleTagsByTagName = async (article,tags,options) => {
  if(_.isString(tags)) tags=[tags];
  tags = await tagService.getManyTagByName(tags);
  return removeArticleTags(article,tags,options);
};

/**
 * Search Tags of an article using naive word match
 * @param {Article} article
 * @param {[Tag]} tags
 * @returns {[Tag]}
 */
const searchArticleTags = async (article,tags) => {
  if(!tags || !tags.length) return []; 
  if(!tags[0] instanceof Tag){
    throw new ApiError(httpStatus.NOT_FOUND, 'article.addArticleTags expects tags instance. Invalid type found');
  }
  article = await getArticleInstance(article,{raise:true});
  let content=`${article.title} ${article.shortText} ${article.fullText}`;
  const selectedTags = [];
  for(let i=0;i<tags.length;i++){
    if(hasWord(content,tags[i].aliases || [])){
      selectedTags.push(tags[i]);
    }
  }
  return selectedTags;
}

/**
 * Search Tags of an article by Tag ids
 * @param {Article|ObjectId} article
 * @param {[ObjectId]} tags
 * @returns {Promise<[Tag]>}
 */
const searchArticleTagsByTagId = async (article,tags) =>{
  tags = await tagService.getManyTagById(tags);
  return searchArticleTags(article,tags);
}

/**
 * Search Tags of an article by Tag Name
 * @param {Article|ObjectId} article
 * @param {[string]} tags
 * @returns {Promise<[Tag]>}
 */
const searchArticleTagsByTagName = async (article,tags) =>{
  tags = await tagService.getManyTagByName(tags);
  return searchArticleTags(article,tags);
}

module.exports = {
  getArticleInstance,
  getIfExist,
  getArticleById,
  queryArticles,
  searchArticles,

  createArticle,
  updateArticleById,
  deleteArticleById,
  createManyArticles,

  addArticleTags,
  addArticleTagsByTagId,
  addArticleTagsByTagName,
  removeArticleTags,
  removeArticleTagsByTagId,
  removeArticleTagsByTagName,

  searchArticleTags,
  searchArticleTagsByTagId,
  searchArticleTagsByTagName,
};

