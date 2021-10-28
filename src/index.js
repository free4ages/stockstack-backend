const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const pubsub = require('./pubsub');
const pubSubRoutes = require('./pubSubRoutes');

let server;
let exitFns = [];
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
    exitFns = [...exitFns, ...pubsub.init(pubSubRoutes, config, { push: true, forwarder: true })];
  });
});

const exitHandler = () => {
  exitFns.map((fn) => fn());
  exitFns = [];

  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

// process.removeAllListeners('uncaughtException');
// process.removeAllListeners('unhandledRejection');
process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
  exitFns.map((fn) => fn());
  exitFns = [];
});
process.on('SIGINT', () => {
  logger.info('SIGINT received');
  if (server) {
    server.close();
  }
  exitFns.map((fn) => fn());
  exitFns = [];
});
