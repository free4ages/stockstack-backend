const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { feedService } = require('../services');
const pubSub = require('../pubsub');
const raiseNotFound = require('../utils/raiseNotFound');
const ClassicCrawler = require('../crawlers/classic.crawler');

const createFeed = catchAsync(async (req, res) => {
  const feed = await feedService.createFeed(req.body);
  res.status(httpStatus.CREATED).send(feed);
});

const getFeeds = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await feedService.queryFeeds(filter, options);
  res.send(result);
});

const getFeed = catchAsync(async (req, res) => {
  const feed = await feedService.getFeedById(req.params.feedId);
  if (!feed) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feed not found');
  }
  res.send(feed);
});


const updateFeed = catchAsync(async (req, res) => {
  const feed = await feedService.updateFeedById(req.params.feedId, req.body);
  res.send(feed);
});

const deleteFeed = catchAsync(async (req, res) => {
  await feedService.deleteFeedById(req.params.feedId);
  res.status(httpStatus.NO_CONTENT).send();
});

const crawlFeed = catchAsync(async (req,res) => {
  const feed = raiseNotFound(await feedService.getFeedById(req.body.feedId));
  const force = req.body.force;
  const create = req.body.create;
  const crawler = new ClassicCrawler(feed);
  const articles = await crawler.crawl({force,create});
  //pubSub.push("feed.crawl",{feedId:feed.id});
  response = articles.map((article)=> article.article);
  res.send(response);
});

module.exports = {
  createFeed,
  getFeeds,
  getFeed,
  updateFeed,
  deleteFeed,
  crawlFeed
};


