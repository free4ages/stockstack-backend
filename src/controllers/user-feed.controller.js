const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userFeedService } = require('../services');

const getUserFeed = catchAsync(async (req, res) => {
  const userFeed = await userFeedService.getUserFeedById(req.params.userFeedId, { raise: true });
  res.send(userFeed);
});

const getUserFeeds = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['readLater', 'isRead', 'important', 'deleted', 'tags', 'sourceDomain', 'recommended']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  filter.user = req.user._id;
  const userFeeds = await userFeedService.queryUserFeeds(filter, options);
  res.send(userFeeds);
});
const getUserFeedCount = catchAsync(async (req, res) => {
  const { user } = req;
  const filter = pick(req.query, ['readLater', 'isRead', 'important', 'deleted', 'tags', 'sourceDomain', 'recommended']);
  filter.user = req.user._id;
  const counts = await userFeedService.getFeedCountGroupByTag(filter);
  res.send(counts);
});

const markUserFeedRead = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value } = req.body;
  const success = value
    ? await userFeedService.markFeedAsRead(userFeedId, { user: user._id })
    : await userFeedService.markFeedAsUnRead(userFeedId, { user: user._id });
  res.send({ success });
});

const markUserFeedImportant = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value } = req.body;
  const success = value
    ? await userFeedService.markFeedAsImportant(userFeedId, { user: user._id })
    : await userFeedService.markFeedAsUnImportant(userFeedId, { user: user._id });
  res.send({ success });
});

const markUserFeedDeleted = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value } = req.body;
  const success = value
    ? await userFeedService.markFeedAsDeleted(userFeedId, { user: user._id })
    : await userFeedService.markFeedAsUnDeleted(userFeedId, { user: user._id });
  res.send({ success });
});

const markUserFeedReadLater = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value } = req.body;
  const success = value
    ? await userFeedService.addFeedToUserReadList(userFeedId, { user: user._id })
    : await userFeedService.removeFeedFromUserReadList(userFeedId, { user: user._id });
  res.send({ success });
});

const markArticleRead = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value } = req.body;
  const success = value
    ? await userFeedService.markArticleAsRead(user._id, articleId)
    : await userFeedService.markArticleAsUnRead(user._id, articleId);
  res.send({ success });
});

const markArticleImportant = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value } = req.body;
  const success = value
    ? await userFeedService.markArticleAsImportant(user._id, articleId)
    : await userFeedService.markArticleAsUnImportant(user._id, articleId);
  res.send({ success });
});

const markArticleDeleted = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value } = req.body;
  const success = value
    ? await userFeedService.markArticleAsDeleted(user._id, articleId)
    : await userFeedService.markArticleAsUnDeleted(user._id, articleId);
  res.send({ success });
});

const markArticleReadLater = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value } = req.body;
  const success = value
    ? await userFeedService.addArticleToUserReadList(user, articleId)
    : await userFeedService.removeArticleFromUserReadList(user, articleId);
  res.send({ success });
});

module.exports = {
  getUserFeeds,
  getUserFeed,
  getUserFeedCount,
  markUserFeedRead,
  markUserFeedImportant,
  markUserFeedDeleted,
  markUserFeedReadLater,
  markArticleRead,
  markArticleImportant,
  markArticleDeleted,
  markArticleReadLater,
};
