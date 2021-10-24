const PubSubRouter = require('../utils/pubsubRouter');
const validate = require('../middlewares/pubSubValidate');

const articleController = require('./article.subscriber');
const articlePayload = require('../payload/article.payload');

const feedController = require('./feed.subscriber');
const feedPayload = require('../payload/feed.payload');

const router = PubSubRouter();

router.on(
  'pull',
  'article.create',
  validate(articlePayload.create),
  articleController.create
);

router.on(
  'pull',
  'article.*',
  validate(articlePayload.log),
  articleController.log,
  {middleware:true}
);

router.on(
  'pull',
  'feed.crawl',
  validate(feedPayload.crawl),
  feedController.crawl
);

module.exports = router;

