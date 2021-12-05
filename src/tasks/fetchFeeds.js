const config = require('../config/config');
const logger = require('../config/logger');
const { feedService } = require('../services');
const pubsub = require('../pubsub');

const fetchFeeds = async () => {
  const hr = new Date().getHours();
  if (hr > 1 && hr < 5) {
    logger.info('Skipping as sleep time');
    return;
  }
  const feeds = await feedService.listFetchable(config.crawler.fetchPerMinute);
  if (!feeds.length) {
    logger.info('No feed to fetch');
  }
  feeds.map((feed) => {
    logger.info(`Pushed ${feed.link}`);
    pubsub.push('feed.crawl', { feedId: feed._id.toString() });
    return true;
  });
};

module.exports = fetchFeeds;
