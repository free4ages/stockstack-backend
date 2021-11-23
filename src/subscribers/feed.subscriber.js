const feedService = require('../services/feed.service');
const {resolveCrawler} = require('../crawlers');

const crawl = async (payload, req) => {
  console.log('Got crawler request', req);
  const { feedId } = payload;
  const feed = await feedService.getFeedById(feedId);
  const crawlerClass = resolveCrawler(feed.crawler);
  const crawler = new crawlerClass(feed);
  await crawler.crawl();
};

module.exports = {
  crawl,
};
