const httpStatus = require('http-status');
const _ = require('lodash')
const ApiError = require('../utils/ApiError');

const { UserFeed,User,Article } = require('../models');
const { userService,articleService } = require('../services');

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
    articleService.getArticleInstance(articleId,{raise})
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
 * Get Feed Count by Condition
 * @param {Object} filter
 * @returns {Promise<{name:string,count:number}>}
 */
const getFeedCountGroupByTag = async (filter={}) => {
  return UserFeed
    .aggregate()
    .match(filter)
    .unwind("$tags")
    .group({_id:"$tags",count:{$sum:1}})
    .project({name:"$_id",count:1,_id:0})
    .sort({count:-1});
}

/**
 * Get userFeed by userFeedId
 * @param {ObjectId} userFeedId
 * @returns {Promise<UserFeed>}
 */
const getUserFeedById = async (userFeedId,{raise=true}={}) => {
  const userFeed = UserFeed.findById(userFeedId);
  if(!userFeed && raise){
    throw new ApiError(httpStatus.NOT_FOUND, 'UserFeed not found');
  }
  return userFeed;
}

/**
 * Create/Update UserFeed
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @param {Object} body
 * @returns {UserFeed}
 */
const createOrUpdateUserFeed = async (userId,articleId,body={}) => {
  const {user,article} = await resolveUserArticle({userId,articleId,raise:true});
  let userFeed = await getUserFeed(user._id,article._id);
  if(userFeed){
    if(Object.keys(body).length){
      Object.assign(userFeed,body);
      userFeed.save();
    }
  }
  else{
    body = await populateArticleData(article,body);
    body.user = user._id;
    body.article = article._id;
    userFeed = await UserFeed.create(body);
  }
  return userFeed;
};

/**
 * Adds article to UserFeed
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserFeed = async (userId,articleId) => {
  return !!createOrUpdateUserFeed(userId,articleId);
};

/**
 * Adds article to UserFeed in readlist bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserReadList = async (userId,articleId) => {
  return !!createOrUpdateUserFeed(userId,articleId,{readLater:true,isRead:false,readDate:null});
};

/**
 * Removes article from UserFeed i.e removes readlist bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {Boolean}
 */
const removeArticleFromUserReadList = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{readLater:false}});
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
  const result = await UserFeed.updateMany({user:userId,article:{$in:articleIds}},{$set:{readLater:false}});
  return !!result.matchedCount;
};


/**
 * Adds feed to ReadList
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {UserFeed}
 */
const addFeedToUserReadList = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{readLater:true,isRead:false,readDate:null}});
  return !!result.matchedCount;
};

/**
 * Removes feed from ReadList
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {Boolean}
 */
const removeFeedFromUserReadList = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{readLater:false}});
  return !!result.matchedCount;
};

/**
 * Removes multiple feeds from Read List
 * @param {[ObjectId]} userFeedIds
 * @param {Object} filter
 * @returns {Boolean}
 */
const removeManyFeedFromUserReadList = async (userFeedIds,filter={}) => {
  if(!userFeedIds || !userFeedIds.length) return false;
  filter._id = {$in:userFeedIds};
  const result = await UserFeed.updateMany(filter,{$set:{readLater:false}});
  return !!result.matchedCount;
};

/**
 * Removes all feeds from ReadList
 * @param {ObjectId} userId
 * @returns {Boolean}
 */
const removeAllFeedFromUserReadList = async (userId) => {
  const result = await UserFeed.updateMany({user:userId},{$set:{readLater:false}});
  return !!result.matchedCount;
};
/**
 * Adds article to UserFeed in recommended bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserRecommendedList = async (userId,articleId) => {
  return createOrUpdateUserFeed(userId,articleId,{recommended:true});
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
const queryUserFeeds = async (filter,options) => {
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
  Object.assign(filter || {},{readLater:true});
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
  Object.assign(filter || {},{recommended:true});
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
  Object.assign(filter || {},{important:true});
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
  const userFeed = await createOrUpdateUserFeed(userId,articleId,{isRead:true,readDate:new Date(),readLater:false});
  return true;
}

/**
 * Marks multiple Article as Read. Marks only article available in feed
 * @param {ObjectId} userId
 * @param {[ObjectId]} articleIds
 * @returns {Boolean}
 */
const markManyArticleAsRead = async (userId,articleIds) => {
  const result = await UserFeed.updateMany({user:userId,article:{$in:articleIds}},{$set:{isRead:true,readDate:new Date(),readLater:false}});
  return true;
}

/**
 * Marks UserFeed as Read.
 * @param {Object} filter
 * @param {ObjectId} userId  - Optional
 * @returns {Boolean}
 */
const markFeedAsRead = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{isRead:true,readDate:new Date(),readLater:false}});
  return !!result.matchedCount;
}

/**
 * Marks Article as UnRead. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnRead = async (userId,articleId) => {
  const result = await UserFeed.updateOne({user:userId,article:articleId},{$set:{isRead:false,readDate:null,deleted:false}});
  return !!result.matchedCount;
}

/**
 * Marks UserFeed as UnRead by userFeedId
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {Boolean}
 */
const markFeedAsUnRead = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{isRead:false,readDate:null,deleted:false}});
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
 * @param {Object} filter
 * @returns {Boolean}
 */
const markFeedAsDeleted = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{deleted:true}});
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
const markFeedAsUnDeleted = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{deleted:false}});
  return !!result.matchedCount;
}

/**
 * Marks Article as Important. Adds Article to User Feed if not exists
 * @param {User|ObjectId} userId
 * @param {Article|ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsImportant = async (userId,articleId) => {
  const userFeed = await createOrUpdateUserFeed(userId,articleId,{important:true,deleted:false});
  return true;
}

/**
 * Marks UserFeed as Important.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsImportant = async (userFeedId,filter={}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{important:true,deleted:false}});
  return !!result.matchedCount;
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
const markFeedAsUnImportant = async (userFeedId,filter={}) => {
  filter._id= userFeedId;
  const result = await UserFeed.updateOne(filter,{$set:{important:false}});
  return !!result.matchedCount;
}

module.exports = {
  getUserFeed,
  getUserFeedById,
  queryUserFeeds,
  getFeedListOfUser,
  getReadListOfUser,
  getRecommendedListOfUser,
  getFeedCountGroupByTag,

  addArticleToUserFeed,

  addArticleToUserReadList,
  removeArticleFromUserReadList,
  removeManyArticleFromUserReadList,

  addFeedToUserReadList,
  removeFeedFromUserReadList,
  removeManyFeedFromUserReadList,
  removeAllFeedFromUserReadList,

  addArticleToUserRecommendedList,

  markArticleAsRead,
  markArticleAsUnRead,
  markFeedAsRead,
  markFeedAsUnRead,
  markManyArticleAsRead,

  markArticleAsDeleted,
  markArticleAsUnDeleted,
  markFeedAsDeleted,
  markFeedAsUnDeleted,

  markArticleAsImportant,
  markArticleAsUnImportant,
  markFeedAsImportant,
  markFeedAsUnImportant
};
