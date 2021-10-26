const PubSubRouter = require('../utils/pubsubRouter');
const validate = require('../middlewares/pubSubValidate');

const articleMiddleware = require('./article.middleware');
const articlePayload = require('../payload/article.payload');

const feedMiddleware = require('./feed.middleware');
const feedPayload = require('../payload/feed.payload');

const router = PubSubRouter();

//router.on(
//  'push',
//  'article.*',
//  validate(articlePayload.log),
//  articleMiddleware.log,
//  {middleware:true}
//);

router.on(
  'push',
  'article.search_tag',
  validate(articlePayload.searchTag),
  false
);

router.on(
  'push',
  'article.search_tag_set',
  validate(articlePayload.searchTagSet),
  false
);

router.on(
  'push',
  'feed.crawl',
  validate(feedPayload.crawl),
  false
);

module.exports = router;


