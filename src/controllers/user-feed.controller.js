const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { userFeedService } = require('../services');

const makeFilterQuery = (obj) => {
  const filter = pick(obj, [
    'readLater',
    'isRead',
    'important',
    'deleted',
    'tagNames',
    'sourceDomain',
    'recommended',
    'q',
    'pinTags',
  ]);
  if (filter.tagNames) {
    filter.tags = { $in: filter.tagNames.toLowerCase().split(',') };
    delete filter.tagNames;
  }
  if (filter.q) {
    filter.$text = { $search: filter.q };
    delete filter.q;
  }
  if (filter.pinTags) {
    filter.pinTags =
      filter.pinTags === 'all'
        ? { $exists: true, $not: { $size: 0 } }
        : { $in: filter.pinTags.trim().toLowerCase().split(',') };
  }
  return filter;
};
const getUserFeed = catchAsync(async (req, res) => {
  const userFeed = await userFeedService.getUserFeedById(req.params.userFeedId, { raise: true });
  res.send(userFeed);
});

const getUserFeeds = catchAsync(async (req, res) => {
  const filter = makeFilterQuery(req.query);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'paginate']);
  if (options.sortBy === 'default') {
    options.sortBy = 'pubDate:desc';
  }
  filter.user = req.user._id;
  const userFeeds = await userFeedService.queryUserFeeds(filter, options);
  res.send(userFeeds);
});

const getPinnedUserFeeds = catchAsync(async (req, res) => {
  const filter = {};
  const queryTags = req.query.tagNames;
  const tagNames = queryTags ? queryTags.trim().toLowerCase().split(',') : null;
  if (tagNames) {
    filter.pinTags = { $in: tagNames };
  } else {
    filter.pinTags = { $exists: true, $not: { $size: 0 } };
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'paginate', 'all']);
  if (options.sortBy === 'default') {
    options.sortBy = 'pubDate:desc';
  }
  filter.user = req.user._id;
  const userFeeds = await userFeedService.queryUserFeeds(filter, options);
  res.send(userFeeds);
});

const getUserFeedCount = catchAsync(async (req, res) => {
  const filter = makeFilterQuery(req.query);
  filter.user = req.user._id;
  const counts = await userFeedService.getFeedCountGroupByTag(filter);
  res.send(counts);
});

const getUserFeedInfo = catchAsync(async (req, res) => {
  const filter = pick(req.body, ['articleIds']);
  if (filter.articleIds) {
    filter.article = { $in: filter.articleIds };
  }
  filter.user = req.user._id;
  const results = await userFeedService.getUserFeedInfo(filter);
  res.send(results);
});

const getUserFeedByArticleIds = catchAsync(async (req, res) => {
  const filter = pick(req.body, ['articleIds']);
  if (filter.articleIds) {
    filter.article = { $in: filter.articleIds };
  }
  filter.user = req.user._id;
  const results = await userFeedService.queryUserFeeds(filter, { all: true });
  res.send(results);
});

const markUserFeedRead = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, userFeedIds, value, updateReadLater = false } = req.body;
  let result;
  if (value) {
    if (userFeedIds) {
      result = await userFeedService.markManyFeedAsRead(userFeedIds, { user: user._id }, updateReadLater);
    } else {
      result = await userFeedService.markFeedAsRead(userFeedId, { user: user._id }, updateReadLater);
    }
  } else if (userFeedId) {
    result = await userFeedService.markFeedAsUnRead(userFeedId, { user: user._id });
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'userFeedId or userFeedIds required');
  }
  res.send(result);
});

const markUserFeedSeen = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, userFeedIds, value, updateReadLater = false } = req.body;
  let result;
  if (value) {
    if (userFeedIds) {
      result = await userFeedService.markManyFeedAsSeen(userFeedIds, { user: user._id }, updateReadLater);
    } else {
      result = await userFeedService.markFeedAsSeen(userFeedId, { user: user._id }, updateReadLater);
    }
  } else if (userFeedId) {
    result = await userFeedService.markFeedAsUnSeen(userFeedId, { user: user._id });
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'userFeedId or userFeedIds required');
  }
  res.send(result);
});

const markUserFeedReadBulk = catchAsync(async (req, res) => {
  const { user } = req;
  const { updateReadLater = false } = req.body;
  const filter = makeFilterQuery(req.body);
  filter.user = user._id;
  const result = await userFeedService.markAllFeedAsRead(filter, updateReadLater);
  res.send(result);
});

const markUserFeedImportant = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value } = req.body;
  const result = value
    ? await userFeedService.markFeedAsImportant(userFeedId, { user: user._id })
    : await userFeedService.markFeedAsUnImportant(userFeedId, { user: user._id });
  res.send(result);
});

const markUserFeedDeleted = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value } = req.body;
  const result = value
    ? await userFeedService.markFeedAsDeleted(userFeedId, { user: user._id })
    : await userFeedService.markFeedAsUnDeleted(userFeedId, { user: user._id });
  res.send(result);
});

const markUserFeedReadLater = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value, updateRead = true } = req.body;
  const result = value
    ? await userFeedService.addFeedToUserReadList(userFeedId, { user: user._id }, updateRead)
    : await userFeedService.removeFeedFromUserReadList(userFeedId, { user: user._id });
  res.send(result);
});

const markUserFeedPinned = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, addTagNames,removeTagNames } = req.body;
  const result={};
  if(addTagNames && addTagNames.length){
    const result1 = await userFeedService.pinFeedForTags(userFeedId, addTagNames, { user: user._id })
    result['addCount'] = result1.modified;
  }
  if(removeTagNames && removeTagNames.length){
    const result2 = await userFeedService.unPinFeedForTags(userFeedId, removeTagNames, { user: user._id })
    result['removeCount'] = result2.modified;
  }
  result['success'] = true;
  res.send(result);
});

const markArticleRead = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value, updateReadLater = false } = req.body;
  const result = value
    ? await userFeedService.markArticleAsRead(user._id, articleId, updateReadLater)
    : await userFeedService.markArticleAsUnRead(user._id, articleId);
  res.send(result);
});

const markArticleImportant = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value } = req.body;
  const result = value
    ? await userFeedService.markArticleAsImportant(user._id, articleId)
    : await userFeedService.markArticleAsUnImportant(user._id, articleId);
  res.send(result);
});

const markArticleDeleted = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value } = req.body;
  const result = value
    ? await userFeedService.markArticleAsDeleted(articleId,{user:user._id})
    : await userFeedService.markArticleAsUnDeleted(articleId,{user:user._id});
  res.send(result);
});

const markArticleReadLater = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value, updateRead = true } = req.body;
  const result = value
    ? await userFeedService.addArticleToUserReadList(user, articleId, updateRead)
    : await userFeedService.removeArticleFromUserReadList(user._id, articleId);
  res.send(result);
});

module.exports = {
  getUserFeeds,
  getPinnedUserFeeds,
  getUserFeed,
  getUserFeedCount,
  getUserFeedByArticleIds,
  getUserFeedInfo,
  markUserFeedRead,
  markUserFeedImportant,
  markUserFeedDeleted,
  markUserFeedReadLater,
  markUserFeedReadBulk,
  markUserFeedSeen,
  markUserFeedPinned,
  markArticleRead,
  markArticleImportant,
  markArticleDeleted,
  markArticleReadLater,
};
