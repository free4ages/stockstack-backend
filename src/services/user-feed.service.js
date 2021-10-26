const httpStatus = require('http-status');
const _ = require('lodash')
const ApiError = require('../utils/ApiError');

const { UserFeed,User,Article } = require('../models');
const { userService,ArticleService } = require('../services');

const populateArticleData = async (article,feedObj) => {
  const articleData = {
    title: article.title,
    shortText: article.shortText,
    pubDate: article.pubDate,
    retrieveDate : article.retrieveDate,
    tags: article.tags,
    sourceDomain: article.sourceDomain
  };
  Object.assign(feedObj,articleData);
  return feedObj;
}

/**
 * Convert UserId or ArticleId to instances 
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {{User,Article}}
 */
const resolveUserArticle = async ({userId,articleId,raise=true}) =>{
  const [user,article] = await Promise.all([
    userService.getUserInstance(userId,{raise}),
    articleService.getArticleInstance(articleId,{raise});
  ]);
  return {user,article};
};

/**
 * Get userFeed by userId and articleId
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Promise<UserFeed>}
 */
const getUserFeed = async (userId,articleId) => {
  return UserFeed.findOne({user:userId,article:articleId});
}

/**
 * Create/Update UserFeed
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @param {Object} body
 * @returns {UserFeed}
 */
const createOrUpdateUserFeed = async (userId,articleId,body) => {
  const {user,article} = await resolveUserArticle({userId,articleId,raise:true});
  let userFeed = await getUserFeed(user._id,article._id);
  if(userFeed){
    if(body.bucket && _.isString(body.bucket)){
      body.bucket = _.includes(userFeed.bucket,body.bucket)?userFeed.bucket:userFeed.bucket+[body.bucket];
    }
    Object.assign(userFeed,body);
    userFeed.save();
  }
  else{
    if(body.bucket){
      body.bucket = _.isString(body.bucket)?[body.bucket]:body.bucket;
    }
    else{
      //set bucket as feed if not provided
      body.bucket = ['feed'];
    }
    body = await populateArticleData(article,body);
    userFeed = await UserFeed.create(body);
  }
  return userFeed;
};

/**
 * Adds article to UserFeed in feed bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserFeedList = async (userId,articleId) => {
  return createOrUpdateUserFeed(userId,articleId,{bucket:'feed'});
};

/**
 * Adds article to UserFeed in readlist bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserReadList = async (userId,articleId) => {
  return createOrUpdateUserFeed(userId,articleId,{bucket:'readlist'});
};

/**
 * Removes article from UserFeed i.e removes readlist bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {Boolean}
 */
const removeArticleFromUserReadList = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$pull:{bucket:'readlist'}});
  return !!result.matchedCount;
};

/**
 * Removes multiple articles from UserFeed readlist bucket
 * @param {ObjectId} userId
 * @param {[ObjectId]} articleIds
 * @returns {Boolean}
 */
const removeManyArticleFromUserReadList = async (userId,articleIds) => {
  if(!articleIds || !articleIds.length) return false;
  const result = await UserFeed.updateMany({user:userId,article:{$in:articleIds}},{$pull:{bucket:'readlist'}});
  return !!result.matchedCount;
};

/**
 * Removes all articles from UserFeed readlist bucket
 * @param {ObjectId} userId
 * @returns {Boolean}
 */
const removeAllArticleFromUserReadList = async (userId) => {
  if(!articleIds || !articleIds.length) return false;
  const result = await UserFeed.updateMany({user:userId},{$pull:{bucket:'readlist'}});
  return !!result.matchedCount;
};

/**
 * Adds article to UserFeed in recommended bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserRecommendedList = async (userId,articleId) => {
  return createOrUpdateUserFeed(userId,articleId,{bucket:'recommended'});
};

/**
 * Query for userFeeds
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUserFeed = async (user,filter,options) => {
  const userFeeds = await UserFeed.paginate(filter,options);
  return userFeeds;
};

/**
 * Query for userFeeds in feed bucket
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getFeedListOfUser = async (user,filter,options) => {
  Object.assign(filter || {},{bucket:'feed'});
  const userFeeds = await UserFeed.paginate(filter,options);
  return userFeeds;
};

/**
 * Query for userFeeds in readlist bucket
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getReadListOfUser = async (user,filter,options) => {
  Object.assign(filter || {},{bucket:'readlist'});
  const userFeeds = await UserFeed.paginate(filter,options);
  return userFeeds;
};

/**
 * Query for userFeeds in recommended bucket
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getRecommendedListOfUser = async (user,filter,options) => {
  Object.assign(filter || {},{bucket:'recommended'});
  const userFeeds = await UserFeed.paginate(filter,options);
  return userFeeds;
};

/**
 * Query for userFeeds which has been marked important
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getImportantListofUser = async (user,filter,options) => {
  Object.assign(filter || {},{deleted:false,important:true});
  const userFeeds = await UserFeed.paginate(filter,options);
  return userFeeds;
};


/**
 * Marks Article as Read. Adds Article to User Feed if not exists
 * @param {User|ObjectId} userId
 * @param {Article|ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsRead = async (userId,articleId) => {
  const userFeed = await createOrUpdateUserFeed(userId,articleId,{read:true,readDate:new Date()});
  return true;
}

/**
 * Marks multiple Article as Read. Marks only article available in feed
 * @param {ObjectId} userId
 * @param {[ObjectId]} articleIds
 * @returns {Boolean}
 */
const markManyArticleAsRead = async (userId,articleIds) => {
  const result = await UserFeed.updateMany({user:userId,article:{$in:articleIds}},{$set:{read:true,readDate:new Date()}});
  return true;
}

/**
 * Marks UserFeed as Read.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsRead = async (userFeedId) => {
  const result = await UserFeed.updateOne({_id:userFeedId},{$set:{read:true,readDate:new Date()}});
  return !!result.matchedCount;
}

/**
 * Marks Article as UnRead. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnRead = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{read:false,readDate:undefined}});
  return !!result.matchedCount;
}

/**
 * Marks UserFeed as UnRead by userFeedId
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsUnRead = async (userFeedId) => {
  const result = await UserFeed.updateOne({_id:userFeedId},{$set:{read:false,readDate:undefined}});
  return !!result.matchedCount;
}

/**
 * Marks Article as Deleted. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsDeleted = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{deleted:true}});
  return !!result.matchedCount;
}

/**
 * Marks UserFeed as Deleted.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsDeleted = async (userFeedId) => {
  const result = await UserFeed.updateOne({_id:userFeedId},{$set:{deleted:false}});
  return !!result.matchedCount;
}

/**
 * Marks Article as UnDeleted. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnDeleted = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{deleted:false}});
  return !!result.matchedCount;
}

/**
 * Marks UserFeed as UnDeleted.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsUnDeleted = async (userFeedId) => {
  const result = await UserFeed.updateOne({_id:userFeedId},{$set:{deleted:false}});
  return !!result.matchedCount;
}

/**
 * Marks Article as Important. Adds Article to User Feed if not exists
 * @param {User|ObjectId} userId
 * @param {Article|ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsImportant = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{important:true}});
  return !!result.matchedCount;
}

/**
 * Marks UserFeed as Important.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsImportant = async (userFeedId) => {
  const userFeed = await createOrUpdateUserFeed(userId,articleId,{read:true,readDate:new Date(),important:true,deleted:false});
  return true;
}

/**
 * Marks Article as UnImportant. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnImportant = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{important:false}});
  return !!result.matchedCount;
}

/**
 * Marks UserFeed as Unimportant.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsUnImportant = async (userFeedId) => {
  const result = await UserFeed.updateOne({_id:userFeedId},{$set:{important:false}});
  return !!result.matchedCount;
}

module.exports = {
  getUserFeed,
  queryUserFeed,
  getFeedListOfUser,
  getReadListOfUser,
  getRecommendedListOfUser,

  addArticleToUserFeedList,
  addArticleToUserReadList,
  addArticleToUserRecommendedList,

  markArticleAsRead,
  markManyArticleAsRead,
  markFeedAsRead,
  markArticleAsUnRead,
  markFeedAsUnRead,
  markArticleAsDeleted,
  markFeedAsDeleted,
  markArticleAsUnDeleted,
  markArticleAsImportant,
  markFeedAsImportant,
  markArticleAsUnImportant,
  markFeedAsUnImportant
}
