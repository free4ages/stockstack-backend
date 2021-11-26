const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const pubsub = require('./pubsub');
const pubSubRoutes = require('./pubSubRoutes');
const wsHandlers = require('./wshandlers');
const socketio = require('./socketio');

const wsServer = http.createServer(express());

let server;
let wssocketio;

let exitFns = [];
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
    exitFns = [...exitFns, ...pubsub.init(pubSubRoutes, config, { push: true, forwarder: true })];
  });

  wssocketio = socketio.init(wsServer, config, wsHandlers);
  wsServer.listen(config.socketPort, () => {
    logger.info(`Web Socket listening on port ${config.socketPort}`);
  });
});

exitFns.push(() => mongoose.disconnect());
exitFns.push(() => server && server.close());
exitFns.push(() => wsServer && wsServer.close());
exitFns.push(() => wssocketio && wssocketio.close());

const exitHandler = () => {
  exitFns.map((fn) => fn());
  exitFns = [];
  process.exit(1);
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
  exitFns.map((fn) => fn());
  exitFns = [];
  process.exit(0);
});
process.on('SIGINT', () => {
  logger.info('SIGINT received');
  exitFns.map((fn) => fn());
  exitFns = [];
  process.exit(0);
});
