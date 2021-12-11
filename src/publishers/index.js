const PubSubRouter = require('../utils/pubsubRouter');
const validate = require('../middlewares/pubSubValidate');

// const articleMiddleware = require('./article.middleware');
const articlePayload = require('../payload/article.payload');

const feedPayload = require('../payload/feed.payload');

const userFeedPayload = require('../payload/user-feed.payload');

const router = PubSubRouter();

// router.on(
//  'push',
//  'article.*',
//  validate(articlePayload.log),
//  articleMiddleware.log,
//  {middleware:true}
// );

router.on('push', 'article.searchTag', validate(articlePayload.searchTag), false);

router.on('push', 'article.searchTagSet', validate(articlePayload.searchTagSet), false);

router.on('push', 'article.publishArticle', validate(articlePayload.article), false);

router.on('push', 'feed.crawl', validate(feedPayload.crawl), false);

router.on('push', 'userFeed.sendToFeedOnTagAdd', validate(userFeedPayload.sendToFeedOnTagAdd), false);

router.on('push', 'userFeed.removeFromFeedOnTagRemove', validate(userFeedPayload.removeFromFeedOnTagRemove), false);

router.on('push', 'userFeed.pinArticle', validate(userFeedPayload.pinArticle), false);
router.on('push', 'userFeed.articleEdited', validate(userFeedPayload.articleEdited), false);

router.on('push', 'userFeed.articleDeleted', validate(userFeedPayload.articleDeleted), false);

router.on('push', 'userFeed.clusterUpdated', validate(userFeedPayload.clusterUpdated), false);

module.exports = router;
