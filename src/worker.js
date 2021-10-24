const mongoose = require('mongoose');
const express = require('express');
const logger = require('./config/logger');

const workerApp = express();
const config = require('./config/config');
const pubSub = require('./pubsub');


let server;
let exitFns=[];
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = workerApp.listen(config.workerPort, () => {
    logger.info(`Listening to port ${config.workerPort}`);
    exitFns = [...exitFns,...pubSub.init(config,{pull:true})];
  });
});

const exitHandler = () => {
  exitFns.map((fn)=>fn());
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

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
  exitFns.map((fn)=>fn());
  exitFns=[];
});
process.on('SIGINT', () => {
  logger.info('SIGINT received');
  if (server) {
    server.close();
  }
  exitFns.map((fn)=>fn());
  exitFns=[];
});
