const feedService = require('../services/feed.service');
const logger = require('../config/logger');
const { resolveCrawler } = require('../crawlers');

const crawl = async (payload, req) => {
  logger.debug(`Got crawler request${JSON.stringify(req)}`);
  const { feedId } = payload;
  const feed = await feedService.getFeedById(feedId);
  const CrawlerClass = resolveCrawler(feed.crawler);
  const crawler = new CrawlerClass(feed);
  await crawler.crawl();
};

module.exports = {
  crawl,
};
