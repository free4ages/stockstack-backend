const httpStatus = require('http-status');
const { Feed } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const clean = require('../utils/clean');

/**
 * Create a feed
 * @param {Object} feedBody
 * @returns {Promise<Feed>}
 */
const createFeed = async (feedBody) => {
  if (await Feed.doExist(feedBody.link)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Feed already exists');
  }
  return Feed.create(feedBody);
};

/**
 * Query for feeds
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryFeeds = async (filter, options) => {
  const feeds = await Feed.paginate(filter, options);
  return feeds;
};

/**
 * Get feed by id
 * @param {ObjectId} id
 * @returns {Promise<Feed>}
 */
const getFeedById = async (id, { raise = false } = {}) => {
  const feed = Feed.findById(id);
  if (!feed && raise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feed not found');
  }
  return feed;
};

/**
 * Get feed by email
 * @param {string} email
 * @returns {Promise<Feed>}
 */
const getFeedByLink = async (link) => {
  return Feed.findOne({ link });
};

/**
 * Update feed by id
 * @param {ObjectId} feedId
 * @param {Object} updateBody
 * @returns {Promise<Feed>}
 */
const updateFeedById = async (feedId, updateBody) => {
  const feed = await getFeedById(feedId);
  if (!feed) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feed not found');
  }
  if (updateBody.link && (await Feed.doExist(updateBody.link, feedId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Link already exists');
  }
  Object.assign(feed, updateBody);
  await feed.save();
  return feed;
};

/**
 * Delete feed by id
 * @param {ObjectId} feedId
 * @returns {Promise<Feed>}
 */
const deleteFeedById = async (feedId) => {
  const feed = await getFeedById(feedId);
  if (!feed) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feed not found');
  }
  await feed.remove();
  return feed;
};

const addFetchCount = async (feedId, count) => {
  await Feed.updateOne({ _id: feedId }, { $push: { fetchCounts: { fdate: new Date(), num: count } } });
};

const listLate = async (limit = 0) => {
  const now = new Date();
  const minExpiring = new Date(now.getTime() - config.feed.minExpires);
  const maxExpiring = new Date(now.getTime() - config.feed.maxExpires);
  limit = limit || 10000;
  const filters = {
    archived: false,
    disabled: false,
    lastRetrieved: {
      $lt: minExpiring,
    },
    $or: [
      { expires: { $lt: now }, expires: { $ne: null } },
      { lastRetrieved: { $lt: maxExpiring }, lastRetrieved: { $ne: null } },
    ],
  };
  const feeds = await Feed.find(filters).sort('expires').limit(limit);
  return feeds;
};

const listFetchable = async (limit = 0) => {
  const now = new Date();
  const feeds = await listLate(limit);
  const ids = feeds.map((feed) => feed._id);
  await Feed.update({ _id: { $in: ids } }, { $set: { lastRetrieved: now } }, { multi: true });
  return feeds;
};

module.exports = {
  createFeed,
  queryFeeds,
  getFeedById,
  getFeedByLink,
  updateFeedById,
  deleteFeedById,
  listLate,
  listFetchable,
  addFetchCount,
};
