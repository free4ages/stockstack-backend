const PubSubRouter = require('../utils/pubsubRouter');
const validate = require('../middlewares/pubSubValidate');

const articleController = require('./article.subscriber');
const articlePayload = require('../payload/article.payload');

const feedController = require('./feed.subscriber');
const feedPayload = require('../payload/feed.payload');

const userFeedController = require('./user-feed.subscriber');
const userFeedPayload = require('../payload/user-feed.payload');

const router = PubSubRouter();

router.on('pull', 'article.searchTag', validate(articlePayload.searchTag), articleController.searchTag);

router.on('pull', 'article.searchTagSet', validate(articlePayload.searchTagSet), articleController.searchTagSet);

router.on('pull', 'article.publishArticle', validate(articlePayload.article), articleController.publishNewArticle);

// userFeed routes
router.on(
  'pull',
  'userFeed.sendToFeedOnTagAdd',
  validate(userFeedPayload.sendToFeedOnTagAdd),
  userFeedController.sendToFeedOnTagAdd
);

router.on(
  'pull',
  'userFeed.removeFromFeedOnTagRemove',
  validate(userFeedPayload.removeFromFeedOnTagRemove),
  userFeedController.removeFromFeedOnTagRemove
);
// router.on(
//  'pull',
//  'article.*',
//  validate(articlePayload.log),
//  articleController.log,
//  {middleware:true}
// );

router.on('pull', 'feed.crawl', validate(feedPayload.crawl), feedController.crawl);

module.exports = router;
