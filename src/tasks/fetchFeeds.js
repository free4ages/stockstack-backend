const config = require('../config/config');
const {feedService} = require('../services');
const pubsub = require('../pubsub');

const fetchFeeds = async (job) => {
  console.log("Running Task fetchFeeds");
  const feeds = await feedService.listFetchable(config.crawler.fetchPerMinute);
  if(!feeds.length){
    console.log('No feed to fetch');
  }
  feeds.map((feed)=>{
    console.log(`Pushed ${feed.link}`);
    pubsub.push('feed.crawl',{feedId:feed._id.toString()});
  });
};

module.exports = fetchFeeds;
