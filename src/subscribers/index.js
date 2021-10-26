const PubSubRouter = require('../utils/pubsubRouter');
const validate = require('../middlewares/pubSubValidate');

const articleController = require('./article.subscriber');
const articlePayload = require('../payload/article.payload');

const feedController = require('./feed.subscriber');
const feedPayload = require('../payload/feed.payload');

const router = PubSubRouter();

router.on(
  'pull',
  'article.search_tag',
  validate(articlePayload.searchTag),
  articleController.searchTag
);

router.on(
  'pull',
  'article.search_tag_set',
  validate(articlePayload.searchTagSet),
  articleController.searchTagSet
);

//router.on(
//  'pull',
//  'article.*',
//  validate(articlePayload.log),
//  articleController.log,
//  {middleware:true}
//);

router.on(
  'pull',
  'feed.crawl',
  validate(feedPayload.crawl),
  feedController.crawl
);

module.exports = router;

