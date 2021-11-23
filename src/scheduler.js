const mongoose = require('mongoose');
const express = require('express');
const logger = require('./config/logger');

const config = require('./config/config');
const pubsub = require('./pubsub');
const agendaTasks = require('./tasks');

const pubSubRoutes = require('./pubSubRoutes');

const schedulerApp = express();

let server;
let agenda;
let exitFns = [];
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = schedulerApp.listen(config.schedulerPort, () => {
    logger.info(`Listening to port ${config.schedulerPort}`);
  });
  exitFns = [...exitFns, ...pubsub.init(pubSubRoutes, config, { push: true })];
  agenda = agendaTasks.init(config);
});

const exitHandler = () => {
  exitFns.map((fn) => fn());
  exitFns = [];
  if(agenda){
    agenda.close().then(()=>{
      if(server){
        server.close(() => {
          logger.info('Server closed');
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  exitHandler();
});
process.on('SIGINT', () => {
  logger.info('SIGINT received');
  exitHandler()
});

