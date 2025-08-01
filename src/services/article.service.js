const httpStatus = require('http-status');
const _ = require('lodash');
const logger = require('../config/logger');
const pubsub = require('../pubsub');

const ApiError = require('../utils/ApiError');
const clean = require('../utils/clean');
const { hasWord } = require('../utils/wordSearch');
const getDomain = require('../utils/getDomain');

const { Article } = require('../models');
const tagService = require('./tag.service');
const { Tag } = require('../models');
const articleValidator = require('../validations/article.validation');
// Push Triggers

const pushSearchTag = async (articleId) => {
  pubsub.push('article.searchTag', { articleId });
};

const pushSendToFeed = async (articleId, tagNames) => {
  const payload = { articleId };
  if (_.isEmpty(tagNames)) return;
  payload.tagNames = tagNames;
  pubsub.push('userFeed.sendToFeedOnTagAdd', payload);
};

const pushRemoveFromFeed = async (articleId, tagNames) => {
  const payload = { articleId };
  if (_.isEmpty(tagNames)) return;
  payload.tagNames = tagNames;
  pubsub.push('userFeed.removeFromFeedOnTagRemove', payload);
};

const pushPinArticle = async (articleId, tagNames) => {
  const payload = { articleId };
  if (_.isEmpty(tagNames)) return;
  payload.tagNames = tagNames;
  pubsub.push('userFeed.pinArticle', payload);
};

const pushPublishArticleToUser = async (articleId) => {
  const payload = { articleId };
  pubsub.push('article.publishArticle', payload);
};

const pushEditFeedArticleContent = async (articleId,body) => {
  const payload = {articleId,title:body.displayTitle,shortText:body.shortText};
  pubsub.push('userFeed.articleEdited',payload);
};

const pushDeleteFeed = async (articleId) => {
  const payload = {articleId};
  pubsub.push('userFeed.articleDeleted',payload);
};

const pushUpdateFeedCluster = async (clusterId) => {
  const payload = {clusterId};
  pubsub.push('userFeed.clusterUpdated',payload);
};
// Main Methods

/**
 * Get article by id
 * @param {ObjectId} id
 * @returns {Promise<Article>}
 */
const getArticleById = async (id, options = {}) => {
  const { raise = false } = options;
  const article = await Article.findById(id);
  if (!article && raise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Article not found');
  }
  return article;
};

/**
 * Convert articleId to Article
 * @param {ObjectId|Article} articleId
 * @returns {Promise<Article>}
 */
const getArticleInstance = async (articleId, options) => {
  if (!(articleId instanceof Article)) {
    return getArticleById(articleId, options);
  }
  return articleId;
};

const validateArticleBody = async (articleBody) => {
  const schema = articleValidator.createArticle.body;
  const value = await schema.validateAsync(articleBody);
  return value;
};

const getIfExist = async ({
  title = '',
  link = '',
  pageLink = '',
  nDays = 365,
  limit = 1,
  uniqCheck = ['link', 'title'],
}) => {
  const checkTitle = _.includes(uniqCheck, 'title') ? clean(title, { stripHtml: true, lowercase: true }) : null;
  const checkLink = _.includes(uniqCheck, 'link') ? link : null;
  if (!checkLink && !checkTitle) return true;
  let condition = {};
  if (checkTitle && checkLink) {
    condition = { $or: [{ sTitle: checkTitle }, { link: checkLink }] };
  } else if (checkTitle) {
    condition = { sTitle: checkTitle };
  } else if (checkLink) {
    condition = { link: checkLink };
  }
  const qDate = new Date(new Date().getTime() - nDays * 24 * 60 * 60 * 1000);
  condition.retrieveDate = { $gte: qDate };
  // console.log(condition);
  const articles = await Article.find(condition).sort({ retrieveDate: -1 }).limit(limit);
  // console.log("Existing Articles",articles);
  // check if domain of both articles are same
  let found = null;
  const domain = getDomain(link || pageLink);
  if (articles && articles.length) {
    found = domain ? null : articles[0];
    articles.map((article) => {
      if (domain && article.sourceDomain && domain === article.sourceDomain) {
        logger.debug('Domain matched for retrieved article');
        found = article;
      }
      return true;
    });
  }
  return found;
};

/**
 * Add Tags of an article
 * @param {Article|ObjectId} article
 * @param {[Tag]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const addArticleTags = async (article, tags, options = {}) => {
  const { doSendToFeed = true,manual=false } = options;

  if (!tags || !tags.length) return [];
  if (!(tags[0] instanceof Tag)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'article.addArticleTags expects tags instance. Invalid type found');
  }
  article = await getArticleInstance(article, { raise: true });

  // Get new tags
  const tagNames = tags.map((tag) => tag.name);
  // console.log('Valid Tags', tagNames);
  const newTagNames = _.difference(tagNames, article.tags || []);
  const updateBody = { tags: { $each: newTagNames } };
  if(manual){
    Object.assign(updateBody,{vAddedTags:{$each: newTagNames}});
  }
  // Update new tags found in db
  const result = await Article.updateOne({ _id: article._id }, { $addToSet: updateBody });
  const newTags = newTagNames.map((newTagName) => _.find(tags, { name: newTagName }));
  // Update the date of article addition in tag
  if (result.modifiedCount) {
    await tagService.updateArticleAdded(newTags.map((newTag) => newTag._id));
  }

  // send to feed
  if (doSendToFeed && newTagNames.length) {
    pushSendToFeed(article.id, newTagNames);
  }
  return newTags;
};

/**
 * Add Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[string]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const addArticleTagsByTagName = async (article, tags, options) => {
  if (_.isString(tags)) tags = [tags];
  tags = await tagService.getManyTagByName(tags);
  return addArticleTags(article, tags, options);
};

const populateArticle = async (article, updateBody) => {
  const fields = ['title', 'shortText', 'fullText', 'pubDate', 'pubDateRaw'];
  const extra = {};
  fields.map((field) => {
    if (updateBody.pubDate) {
      if (article.pubDateIsDefault) {
        extra.pubDate = updateBody.pubDate;
        extra.pubDateIsDefault = false;
      }
    } else if (!article[field] && updateBody[field]) {
      extra[field] = updateBody[field];
    }
    return true;
  });
  if (updateBody.topics && updateBody.topics.length && _.difference(updateBody.topics, article.topics || []).length) {
    article.topics = article.topics || [];
    extra.topics = _.uniq([...article.topics, ...updateBody.topics]);
  }
  if (updateBody.sources && updateBody.sources.length && _.difference(updateBody.sources, article.sources || []).length) {
    extra.sources = _.uniq([...article.sources, ...updateBody.sources]);
  }
  if (Object.keys(extra).length) {
    logger.debug('Populating data in db');
    extra.isPartial = false;
    Object.assign(article, extra);
    await article.save();
  }
  return article;
};

/**
 * Create a article
 * @param {Object} articleBody
 * @returns {Promise<Article>}
 */
const createArticle = async (body, options = {}) => {
  const {
    uniqCheck = ['title', 'link'], // title,link,all
    skipValidation = false,
    doSearchTag = true,
    doSendToFeed = true,
    doPublishArticleToUser = true,
    dupCheckDays = 90,
    populatePartial = true,
  } = options;
  let isNew = true;
  // strip tags from body to handle seaparately
  const { tags, ...articleBody } = body;
  if (!skipValidation) {
    await validateArticleBody(articleBody);
  }
  let article = await getIfExist({
    title: articleBody.title,
    link: articleBody.link,
    pageLink: articleBody.pageLink,
    limit: 5,
    nDays: dupCheckDays,
    uniqCheck,
  });
  if (
    article &&
    (!article.isPartial || !articleBody.sources || !articleBody.sources.length,
    !_.difference(articleBody.sources, article.sources || []).length ||
      article.feed.toString() === articleBody.feed.toString())
  ) {
    isNew = false;
    logger.debug('Duplicate found. Skipping');
    return { article, isNew };
  }

  if (article) {
    logger.debug('Duplicate found. Populating');
    isNew = false;
    if (populatePartial && article.isPartial) {
      article = await populateArticle(article, articleBody);
    }
  } else {
    // populate source
    logger.debug('Creating New article');
    article = await Article.create(articleBody);
  }
  if (tags && tags.length && _.difference(tags, article.tags || []).length) {
    await addArticleTagsByTagName(article.id, tags, { doSendToFeed });
  }
  if (isNew && doSearchTag) {
    await pushSearchTag(article.id);
  }

  if (isNew && doPublishArticleToUser) {
    await pushPublishArticleToUser(article.id);
  }
  return { article, isNew };
};

const createManyArticles = async (articles, options = {}) => {
  const result = await Promise.allSettled(
    articles.map((article) => {
      return createArticle(article, options);
    })
  );
  let createdCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let totalCount = 0;
  const errors = [];
  result.map(({ status, value, reason }) => {
    totalCount += 1;
    if (status === 'fulfilled') {
      if (value.isNew) {
        createdCount += 1;
      } else {
        duplicateCount += 1;
      }
    } else {
      errorCount += 1;
      errors.push(`${reason}`);
    }
    return true;
  });
  return { totalCount, createdCount, duplicateCount, errorCount, error: errors.join('\n') };
};

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

const searchArticles = async (query, filter = {}, options = {}) => {
  if (query) {
    filter.$text = { $search: query };
  }
  const articles = await Article.paginate(filter, options);
  return articles;
};

/**
 * Update article by id
 * @param {ObjectId} articleId
 * @param {Object} updateBody
 * @returns {Promise<Article>}
 */
const updateArticleById = async (articleId, updateBody) => {
  const article = await getArticleById(articleId, { raise: true });
  Object.assign(article, updateBody);
  await article.save();
  return article;
};

const editArticleContent = async (articleId,updateBody,options={}) => {
  const {doEditFeedArticleContent=true} = options;
  const {displayTitle="",shortText=""} = updateBody;
  const article = await getArticleById(articleId, { raise: true });
  const updateData = {};
  if(displayTitle && article.title!==displayTitle){
    updateData.displayTitle = displayTitle;
  }
  if(shortText && article.shortText!==shortText){
    updateData.shortText = shortText;
  }
  if(Object.keys(updateData).length){
    Object.assign(article,updateData);
    await article.save();
    if(doEditFeedArticleContent){
      pushEditFeedArticleContent(articleId,updateData);
    }
  }
  return article;
};

/**
 * Delete article by id
 * @param {ObjectId} articleId
 * @returns {Promise<Article>}
 */
const deleteArticleById = async (articleId) => {
  const article = await getArticleById(articleId, { raise: true });
  await article.remove();
  return article;
};

/**
 * Add Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[ObjectId]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const addArticleTagsByTagId = async (article, tags, options) => {
  if (_.isString(tags)) tags = [tags];
  tags = await tagService.getManyTagById(tags);
  return addArticleTags(article, tags, options);
};

/**
 * Remove Tags of an article
 * @param {Article|ObjectId} article
 * @param {[Tag]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const removeArticleTags = async (article, tags, options = {}) => {
  const { doRemoveFromFeed = true,manual=false} = options;

  if (!tags || !tags.length) return [];
  if (!(tags[0] instanceof Tag)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'article.addArticleTags expects tags instance. Invalid type found');
  }
  article = await getArticleInstance(article, { raise: true });

  const tagNames = tags.map((tag) => tag.name);
  const removeTagNames = _.intersection(tagNames, article.tags || []);
  const updateBody = { $pull: { tags: { $in: removeTagNames } } };
  if(manual){
    Object.assign(updateBody,{$addToSet:{vRemovedTags:{$each: removeTagNames}}});
  }
  await Article.updateOne({ _id: article._id }, updateBody);

  const removeTags = removeTagNames.map((removeTagName) => _.find(tags, { name: removeTagName }));
  if (doRemoveFromFeed && !_.isEmpty(removeTagNames)) {
    pushRemoveFromFeed(article.id, removeTagNames);
  }
  return removeTags;
};

/**
 * Remove Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[ObjectId]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const removeArticleTagsByTagId = async (article, tags, options) => {
  if (_.isString(tags)) tags = [tags];
  tags = await tagService.getManyTagById(tags);
  return removeArticleTags(article, tags, options);
};

/**
 * Remove Tags of an article by TagId
 * @param {Article|ObjectId} article
 * @param {[string]} tags
 * @param {Object} options
 * @returns {[Tag]}
 */
const removeArticleTagsByTagName = async (article, tags, options) => {
  if (_.isString(tags)) tags = [tags];
  tags = await tagService.getManyTagByName(tags);
  return removeArticleTags(article, tags, options);
};

/**
 * Search Tags of an article using naive word match
 * @param {Article} article
 * @param {[Tag]} tags
 * @returns {[Tag]}
 */
const searchArticleTags = async (article, tags) => {
  if (!tags || !tags.length) return [];
  if (!(tags[0] instanceof Tag)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'article.addArticleTags expects tags instance. Invalid type found');
  }
  article = await getArticleInstance(article, { raise: true });
  const content = `${article.title} ${article.shortText} ${article.fullText}`;
  const selectedTags = [];
  for (let i = 0; i < tags.length; i++) {
    if (hasWord(content, tags[i].aliases || [])) {
      selectedTags.push(tags[i]);
    }
  }
  return selectedTags;
};

/**
 * Search Tags of an article by Tag ids
 * @param {Article|ObjectId} article
 * @param {[ObjectId]} tags
 * @returns {Promise<[Tag]>}
 */
const searchArticleTagsByTagId = async (article, tags) => {
  // console.log('TagIdss', tags);
  tags = await tagService.getManyTagById(tags);
  return searchArticleTags(article, tags);
};

/**
 * Search Tags of an article by Tag Name
 * @param {Article|ObjectId} article
 * @param {[string]} tags
 * @returns {Promise<[Tag]>}
 */
const searchArticleTagsByTagName = async (article, tags) => {
  tags = await tagService.getManyTagByName(tags);
  return searchArticleTags(article, tags);
};

/**
 * Pin Article for given tags.
 * @param {ObjectId} articleId
 * @param {String[]|ObjectId[]|Tag[]} tagObjs
 * @param {Object} filter
 * @returns {Boolean}
 */
const pinArticleForTags = async (articleId, tagObjs, filter={},options = {}) => {
  const { doPinArticle = true } = options;
  const article = await getArticleInstance(articleId, { raise: true });
  const tags = await tagService.resolveManyTags(tagObjs);
  if (!tags.length) {
    return { success: true, modified: 0 };
  }
  const tagNames = tags.map(tag => tag.name);
  const newTagNames = _.difference(tagNames, article.pinTags || []);
  let modifiedCount = 0;
  if (newTagNames.length) {
    const updateBody = { pinTags: { $each: newTagNames } };
    filter._id = articleId;
    const result = await Article.updateOne(filter, { $addToSet: updateBody }, { timestamps: false });
    if (doPinArticle) {
      pushPinArticle(articleId, newTagNames);
    }
    modifiedCount = result.modifiedCount;
  }
  return { success: true, modified: modifiedCount };
};

/**
 * UnPin Article for given tags.
 * @param {ObjectId} articleId
 * @param {String[]|ObjectId[]|Tag[]} tagObjs
 * @param {Object} filter
 * @returns {Boolean}
 */
const unPinArticleForTags = async (articleId, tagObjs, filter = {}) => {
  const tags = await tagService.resolveManyTags(tagObjs);
  if (!tags.length) {
    return { success: true, modified: 0 };
  }
  const updateBody = { pinTags: { $in: tags.map((tag) => tag.name) } };
  filter._id = articleId;
  const result = await Article.updateOne(filter,{$pull:updateBody},{timestamps:false});
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as Deleted.
 * @param {ObjectId} articleId
 * @param {Object} filters
 * @returns {Boolean}
 */
const markArticleAsDeleted = async (articleId,filters={},options={}) => {
  const {doDeleteFeed=true} = options;
  filters._id = articleId;
  const result = await Article.updateOne(
    filters,
    { $set: { archived: true,trash:true } },
    { timestamps: false }
  );
  if(result.modifiedCount && doDeleteFeed){
    pushDeleteFeed(articleId);
  }
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as UnDeleted.
 * @param {ObjectId} articleId
 * @param {Object} filters
 * @returns {Boolean}
 */
const markArticleAsUnDeleted = async (articleId,filters={}) => {
  filters._id = articleId;
  const result = await Article.updateOne(
    filters,
    { $set: { archived: false, trash: false } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

const markArticlesSimilar = async (articleIds,options={}) => {
  const {doUpdateFeedCluster=true} = options;
  if(!articleIds || !articleIds.length){
    return {success:true,modified: 0};
  }
  const articles = await Article.find({_id:{$in:articleIds}},{clusterId:1,pubDate:1,retrieveDate:1,_id:1}).lean();
  const clusterIds = articles.map((article)=>article.clusterId);
  //find the earliest article of the cluster
  const clusterHead = await Article.find({clusterId:{$in:clusterIds}},{clusterId:1,_id:1}).sort({pubDate:1}).limit(1).lean();
  const parentClusterId = clusterHead[0].clusterId;
  const result = await Article.updateMany({clusterId:{$in:clusterIds}},{$set:{clusterId:parentClusterId}},{timestamps:false});
  if(doUpdateFeedCluster){
    pushUpdateFeedCluster(parentClusterId);
  }
  return {success:true,modified: result.modifiedCount};
};

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

  markArticleAsDeleted,
  markArticleAsUnDeleted,

  addArticleTags,
  addArticleTagsByTagId,
  addArticleTagsByTagName,
  removeArticleTags,
  removeArticleTagsByTagId,
  removeArticleTagsByTagName,

  pinArticleForTags,
  unPinArticleForTags,

  searchArticleTags,
  searchArticleTagsByTagId,
  searchArticleTagsByTagName,

  editArticleContent,
  markArticlesSimilar,
};
