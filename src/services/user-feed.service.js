const httpStatus = require('http-status');
const _ = require('lodash');
const ApiError = require('../utils/ApiError');

const { UserFeed } = require('../models');
const { userService, articleService } = require('.');

const populateArticleData = async (article, feedObj) => {
  const articleData = {
    title: article.displayTitle || article.title,
    shortText: article.shortText,
    pubDate: article.pubDate,
    retrieveDate: article.retrieveDate,
    tags: article.tags,
    link: article.link,
    sourceDomain: article.sourceDomain,
    attachmentLink: article.attachmentLink,
  };
  Object.assign(feedObj, articleData);
  return feedObj;
};

/**
 * Convert UserId or ArticleId to instances
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {{User,Article}}
 */
const resolveUserArticle = async ({ userId, articleId, raise = true }) => {
  const [user, article] = await Promise.all([
    userService.getUserInstance(userId, { raise }),
    articleService.getArticleInstance(articleId, { raise }),
  ]);
  return { user, article };
};

/**
 * Get userFeed by userId and articleId
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Promise<UserFeed>}
 */
const getUserFeed = async (userId, articleId) => {
  return UserFeed.findOne({ user: userId, article: articleId });
};

/**
 * Get Feed Count by Condition
 * @param {Object} filter
 * @returns {Promise<{name:string,count:number}>}
 */
const getFeedCountGroupByTag = async (filter = {}) => {
  return UserFeed.aggregate()
    .match(filter)
    .unwind('$tags')
    .group({ _id: '$tags', count: { $sum: 1 } })
    .project({ name: '$_id', count: 1, _id: 0 })
    .sort({ count: -1 });
};

/**
 * Get userFeed by userFeedId
 * @param {ObjectId} userFeedId
 * @returns {Promise<UserFeed>}
 */
const getUserFeedById = async (userFeedId, { raise = true } = {}) => {
  const userFeed = UserFeed.findById(userFeedId);
  if (!userFeed && raise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'UserFeed not found');
  }
  return userFeed;
};

const getUserFeedInfo = async (filter) => {
  const select = {
    readLater: 1,
    recommended: 1,
    notesCount: 1,
    important: 1,
    isRead: 1,
    deleted: 1,
    article: 1,
  };
  return UserFeed.find(filter, select).lean();
};

/**
 * Create/Update UserFeed
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @param {Object} body
 * @returns {UserFeed}
 */
const createOrUpdateUserFeed = async (userId, articleId, body = {}, options = {}) => {
  const { user, article } = await resolveUserArticle({ userId, articleId, raise: true });

  // Tracking related variables
  const modifiedCounts = {};
  let isNew = true;
  const bodyKeys = Object.keys(body);
  const trackFields = (options.track || []).filter((field) => _.includes(bodyKeys, field));

  let userFeed = await getUserFeed(user._id, article._id);
  if (userFeed) {
    isNew = false;
    if (Object.keys(body).length) {
      // set modified counts
      trackFields.forEach((field) => {
        modifiedCounts[field] = body[field] !== userFeed[field] ? 1 : 0;
      });
      Object.assign(userFeed, body);
      userFeed.save();
    }
  } else {
    body = await populateArticleData(article, body);
    body.user = user._id;
    body.article = article._id;
    userFeed = await UserFeed.create(body);
    // set all trackfields as modified
    trackFields.forEach((field) => {
      modifiedCounts[field] = 1;
    });
  }
  return {
    userFeed,
    modifiedCounts,
    isNew,
  };
};

/**
 * Adds article to UserFeed
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserFeed = async (userId, articleId) => {
  await createOrUpdateUserFeed(userId, articleId);
  return true;
};

/**
 * Adds article to UserFeed in readlist bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserReadList = async (userId, articleId, updateRead = true) => {
  const updateBody = { readLater: true };
  if (updateRead) {
    updateBody.isRead = false;
    updateBody.readDate = null;
  }
  const result = await createOrUpdateUserFeed(userId, articleId, updateBody, { track: ['readLater'] });
  return { success: true, modified: result.modifiedCounts.readLater, added: result.isNew };
};

/**
 * Removes article from UserFeed i.e removes readlist bucket
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const removeArticleFromUserReadList = async (userId, articleId) => {
  const result = await UserFeed.updateOne(
    { user: userId, article: articleId },
    { $set: { readLater: false } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Removes multiple articles from UserFeed readlist bucket
 * @param {ObjectId} userId
 * @param {[ObjectId]} articleIds
 * @returns {Boolean}
 */
const removeManyArticleFromUserReadList = async (userId, articleIds) => {
  if (!articleIds || !articleIds.length) return false;
  const result = await UserFeed.updateMany(
    { user: userId, article: { $in: articleIds } },
    { $set: { readLater: false } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Adds feed to ReadList
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {UserFeed}
 */
const addFeedToUserReadList = async (userFeedId, filter = {}, updateRead = true) => {
  const updateBody = { readLater: true };
  if (updateRead) {
    updateBody.isRead = false;
    updateBody.readDate = null;
  }
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: updateBody }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Removes feed from ReadList
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {Boolean}
 */
const removeFeedFromUserReadList = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: { readLater: false } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Removes multiple feeds from Read List
 * @param {[ObjectId]} userFeedIds
 * @param {Object} filter
 * @returns {Boolean}
 */
const removeManyFeedFromUserReadList = async (userFeedIds, filter = {}) => {
  if (!userFeedIds || !userFeedIds.length) return false;
  filter._id = { $in: userFeedIds };
  const result = await UserFeed.updateMany(filter, { $set: { readLater: false } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Removes all feeds from ReadList
 * @param {ObjectId} userId
 * @returns {Boolean}
 */
const removeAllFeedFromUserReadList = async (userId, filter = {}) => {
  filter.user = userId;
  const result = await UserFeed.updateMany(filter, { $set: { readLater: false } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};
/**
 * Adds article to UserFeed in recommended bucket
 * @param {User|ObjectId} user
 * @param {Article|ObjectId} article
 * @returns {UserFeed}
 */
const addArticleToUserRecommendedList = async (userId, articleId) => {
  const result = createOrUpdateUserFeed(userId, articleId, { recommended: true }, { track: 'recommended' });
  return { success: true, modified: result.modifiedCounts.recommended, added: result.isNew };
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
const queryUserFeeds = async (filter, options) => {
  const userFeeds = await UserFeed.paginate(filter, options);
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
const getFeedListOfUser = async (user, filter, options) => {
  const userFeeds = await UserFeed.paginate(filter, options);
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
const getReadListOfUser = async (user, filter, options) => {
  Object.assign(filter || {}, { readLater: true });
  const userFeeds = await UserFeed.paginate(filter, options);
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
const getRecommendedListOfUser = async (user, filter, options) => {
  Object.assign(filter || {}, { recommended: true });
  const userFeeds = await UserFeed.paginate(filter, options);
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
const getImportantListofUser = async (user, filter, options) => {
  Object.assign(filter || {}, { important: true });
  const userFeeds = await UserFeed.paginate(filter, options);
  return userFeeds;
};

/**
 * Marks Article as Read. Adds Article to User Feed if not exists
 * @param {User|ObjectId} userId
 * @param {Article|ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsRead = async (userId, articleId, updateReadLater = false) => {
  const updateBody = { isRead: true, readDate: new Date(), isSeen: true };
  if (updateReadLater) {
    updateBody.readLater = false;
  }
  const result = await createOrUpdateUserFeed(userId, articleId, updateBody, { track: ['isRead'] });
  return { success: true, modified: result.modifiedCounts.isRead, added: result.isNew };
};

/**
 * Marks multiple Article as Read. Marks only article available in feed
 * @param {ObjectId} userId
 * @param {[ObjectId]} articleIds
 * @returns {Boolean}
 */
const markManyArticleAsRead = async (userId, articleIds, updateReadLater = false) => {
  const updateBody = { isRead: true, readDate: new Date(), isSeen: true };
  if (updateReadLater) {
    updateBody.readLater = false;
  }
  const result = await UserFeed.updateMany(
    { user: userId, article: { $in: articleIds } },
    { $set: updateBody },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as Read.
 * @param {Object} filter
 * @param {ObjectId} userId  - Optional
 * @returns {Boolean}
 */
const markFeedAsRead = async (userFeedId, filter = {}, updateReadLater = false) => {
  const updateBody = { isRead: true, readDate: new Date(), isSeen: true };
  if (updateReadLater) {
    updateBody.readLater = false;
  }
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: updateBody }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Many UserFeed as Read.
 * @param {ObjectId[]} userFeedIds
 * @param {Object} filter
 * @param {Boolean} updateReadLater
 * @returns {Boolean}
 */

const markManyFeedAsRead = async (userFeedIds, filter = {}, updateReadLater = false) => {
  const updateBody = { isRead: true, readDate: new Date(), isSeen: true };
  if (updateReadLater) {
    updateBody.readLater = false;
  }
  filter._id = { $in: userFeedIds };
  const result = await UserFeed.updateMany(filter, { $set: updateBody }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks All UserFeed matching filter as Read.
 * @param {ObjectId[]} userFeedIds
 * @param {Object} filter
 * @param {Boolean} updateReadLater
 * @returns {Boolean}
 */

const markAllFeedAsRead = async (filter = {}, updateReadLater = false) => {
  const updateBody = { isRead: true, readDate: new Date(), isSeen: true };
  if (updateReadLater) {
    updateBody.readLater = false;
  }
  const result = await UserFeed.updateMany(filter, { $set: updateBody }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as UnRead. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnRead = async (userId, articleId) => {
  const result = await UserFeed.updateOne(
    { user: userId, article: articleId },
    { $set: { isRead: false, readDate: null, deleted: false, isSeen: true } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as UnRead by userFeedId
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {Boolean}
 */
const markFeedAsUnRead = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(
    filter,
    { $set: { isRead: false, readDate: null, deleted: false, isSeen: true } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as Seen.
 * @param {Object} filter
 * @param {ObjectId} userId  - Optional
 * @returns {Boolean}
 */
const markFeedAsSeen = async (userFeedId, filter = {}) => {
  const updateBody = { isSeen: true };
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: updateBody }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Many UserFeed as Seen.
 * @param {ObjectId[]} userFeedIds
 * @param {Object} filter
 * @param {Boolean} updateReadLater
 * @returns {Boolean}
 */

const markManyFeedAsSeen = async (userFeedIds, filter = {}) => {
  const updateBody = { isSeen: true };
  filter._id = { $in: userFeedIds };
  const result = await UserFeed.updateMany(filter, { $set: updateBody }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as UnSeen by userFeedId
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {Boolean}
 */
const markFeedAsUnSeen = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: { deleted: false, isSeen: true } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as Deleted. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsDeleted = async (userId, articleId) => {
  const result = await UserFeed.updateOne(
    { user: userId, article: articleId },
    { $set: { deleted: true, isSeen: true } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as Deleted.
 * @param {ObjectId} userFeedId
 * @param {Object} filter
 * @returns {Boolean}
 */
const markFeedAsDeleted = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: { deleted: true, isSeen: true } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as UnDeleted. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnDeleted = async (userId, articleId) => {
  const result = await UserFeed.updateOne(
    { user: userId, article: articleId },
    { $set: { deleted: false, isSeen: true } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as UnDeleted.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsUnDeleted = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: { deleted: false, isSeen: true } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as Important. Adds Article to User Feed if not exists
 * @param {User|ObjectId} userId
 * @param {Article|ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsImportant = async (userId, articleId) => {
  const result = await createOrUpdateUserFeed(
    userId,
    articleId,
    { important: true, deleted: false, isSeen: true },
    { track: ['important'] }
  );
  return { success: true, modified: result.modifiedCounts.important, added: result.isNew };
};

/**
 * Marks UserFeed as Important.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsImportant = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(
    filter,
    { $set: { important: true, deleted: false, isSeen: true } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks Article as UnImportant. Assumes article exist in feed
 * @param {ObjectId} userId
 * @param {ObjectId} articleId
 * @returns {Boolean}
 */
const markArticleAsUnImportant = async (userId, articleId) => {
  const result = await UserFeed.updateOne(
    { user: userId, article: articleId },
    { $set: { important: false, isSeen: true } },
    { timestamps: false }
  );
  return { success: true, modified: result.modifiedCount };
};

/**
 * Marks UserFeed as Unimportant.
 * @param {ObjectId} userFeedId
 * @returns {Boolean}
 */
const markFeedAsUnImportant = async (userFeedId, filter = {}) => {
  filter._id = userFeedId;
  const result = await UserFeed.updateOne(filter, { $set: { important: false, isSeen: true } }, { timestamps: false });
  return { success: true, modified: result.modifiedCount };
};

module.exports = {
  getUserFeed,
  getUserFeedById,
  queryUserFeeds,
  getFeedListOfUser,
  getReadListOfUser,
  getRecommendedListOfUser,
  getImportantListofUser,
  getFeedCountGroupByTag,
  getUserFeedInfo,

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
  markManyFeedAsRead,
  markAllFeedAsRead,
  markManyArticleAsRead,

  markFeedAsSeen,
  markManyFeedAsSeen,
  markFeedAsUnSeen,

  markArticleAsDeleted,
  markArticleAsUnDeleted,
  markFeedAsDeleted,
  markFeedAsUnDeleted,

  markArticleAsImportant,
  markArticleAsUnImportant,
  markFeedAsImportant,
  markFeedAsUnImportant,
};
