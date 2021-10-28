const zmq = require('zeromq');
const logger = require('./config/logger');

const createForwarder = (config) => {
  const pullSocket = zmq.socket('pull');
  const pushSocket = zmq.socket('push');
  // it will be opposite for foewarder
  pullSocket.bindSync(config.zeroMQ.pushUrl);
  pushSocket.bindSync(config.zeroMQ.pullUrl);
  zmq.proxy(pullSocket, pushSocket, null);
  logger.info(`Forwarding request from ${config.zeroMQ.pushUrl} to ${config.zeroMQ.pullUrl}`);
  return () => {
    pullSocket.close();
    pushSocket.close();
  };
};

const initActionPull = (config, router, opts = {}) => {
  const socket = zmq.socket('pull');
  logger.info(`Consumer connected to ${config.zeroMQ.pullUrl}`);
  socket.connect(config.zeroMQ.pullUrl);
  router.addClient('pull', socket);
  //  socket.on('message',(msg)=>{
  //    console.log(`Message received ${msg}`);
  //    console.log(typeof msg);
  //    console.log(JSON.parse(msg));
  //  });
  return () => socket.close();
};

const initActionPush = (config, router, opts = {}) => {
  const socket = zmq.socket('push');
  logger.info(`Publisher connected to ${config.zeroMQ.pushUrl}`);
  socket.connect(config.zeroMQ.pushUrl);
  router.addClient('push', socket);
  return () => socket.close();
};

let pubSubRouter;
const init = (router, config, opts = {}) => {
  pubSubRouter = router;
  const exitFns = [];
  if (opts.forwarder) {
    exitFns.push(createForwarder(config));
  }
  if (opts.push) {
    exitFns.push(initActionPush(config, pubSubRouter, opts));
  }
  if (opts.pull) {
    exitFns.push(initActionPull(config, pubSubRouter, opts));
  }
  // register to on regeive message
  pubSubRouter.init();
  return exitFns;
};

const push = (path, payload) => {
  return pubSubRouter.push(path, payload);
};

module.exports = {
  init,
  push,
};
