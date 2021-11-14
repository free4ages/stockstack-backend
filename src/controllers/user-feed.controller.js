const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { userFeedService } = require('../services');

const getUserFeed = catchAsync(async (req, res) => {
  const userFeed = await userFeedService.getUserFeedById(req.params.userFeedId, { raise: true });
  res.send(userFeed);
});

const getUserFeeds = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['readLater', 'isRead', 'important', 'deleted', 'tagNames', 'sourceDomain', 'recommended','q']);
  if(filter.tagNames){
    filter.tags = {$in:filter.tagNames.toLowerCase().split(',')};
    delete filter.tagNames;
  }
  if(filter.q){
    filter.$text = {$search: filter.q};
    delete filter.q;
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  filter.user = req.user._id;
  const userFeeds = await userFeedService.queryUserFeeds(filter, options);
  res.send(userFeeds);
});

const getUserFeedCount = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['readLater', 'isRead', 'important', 'deleted', 'tagNames', 'sourceDomain', 'recommended']);
  if(filter.tagNames){
    filter.tags = {$in:filter.tagNames.toLowerCase().split(',')};
    delete filter.tagNames;
  }
  filter.user = req.user._id;
  const counts = await userFeedService.getFeedCountGroupByTag(filter);
  res.send(counts);
});

const getUserFeedInfo = catchAsync(async (req,res) => {
  const filter = pick(req.body,['articleIds']);
  if(filter.articleIds){
    filter.article = {$in:filter.articleIds}
  }
  filter.user = req.user._id;
  const results = await userFeedService.getUserFeedInfo(filter);
  res.send(results);
});

const markUserFeedRead = catchAsync(async (req, res) => {
  const { user } = req;
  const { userFeedId, value,updateReadLater=false} = req.body;
  const result = value
    ? await userFeedService.markFeedAsRead(userFeedId, { user: user._id },updateReadLater)
    : await userFeedService.markFeedAsUnRead(userFeedId, { user: user._id });
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
  const { userFeedId, value ,updateRead=true} = req.body;
  const result = value
    ? await userFeedService.addFeedToUserReadList(userFeedId, { user: user._id },updateRead)
    : await userFeedService.removeFeedFromUserReadList(userFeedId, { user: user._id });
  res.send(result);
});

const markArticleRead = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value ,updateReadLater=false} = req.body;
  const result = value
    ? await userFeedService.markArticleAsRead(user._id, articleId,updateReadLater)
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
    ? await userFeedService.markArticleAsDeleted(user._id, articleId)
    : await userFeedService.markArticleAsUnDeleted(user._id, articleId);
  res.send(result);
});

const markArticleReadLater = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, value ,updateRead=true} = req.body;
  const result = value
    ? await userFeedService.addArticleToUserReadList(user, articleId,updateRead)
    : await userFeedService.removeArticleFromUserReadList(user._id, articleId);
  res.send(result);
});


module.exports = {
  getUserFeeds,
  getUserFeed,
  getUserFeedCount,
  getUserFeedInfo,
  markUserFeedRead,
  markUserFeedImportant,
  markUserFeedDeleted,
  markUserFeedReadLater,
  markArticleRead,
  markArticleImportant,
  markArticleDeleted,
  markArticleReadLater,
};
