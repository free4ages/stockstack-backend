const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const tagRoute = require('./tag.route');
const feedRoute = require('./feed.route');
const equityRoute = require('./equity.route');
const articleRoute = require('./article.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/tags',
    route: tagRoute,
  },
  {
    path: '/equities',
    route: equityRoute,
  },
  {
    path: '/feeds',
    route: feedRoute,
  },
  {
    path: '/articles',
    route: articleRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
