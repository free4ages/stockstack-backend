const feedService = require('../services/feed.service');
const ClassicCrawler = require('../crawlers/classic.crawler');

const crawl = async (payload, req) => {
  console.log('Got crawler request', req);
  const { feedId } = payload;
  const feed = await feedService.getFeedById(feedId);
  const crawler = new ClassicCrawler(feed);
  await crawler.crawl();
};

module.exports = {
  crawl,
};
