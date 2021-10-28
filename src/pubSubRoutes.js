const PubSubRouter = require('./utils/pubsubRouter');
const subscriberRoutes = require('./subscribers');
const publisherRoutes = require('./publishers');

const router = PubSubRouter();

router.use(subscriberRoutes);
router.use(publisherRoutes);

module.exports = router;
