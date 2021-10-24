const zmq = require('zeromq')
const pubSubRouter = require('./pubSubRoutes');

const initActionPull = (config,router) => {
  const socket = zmq.socket("pull");
  console.log(`Consumer connected to ${config.zmqPullUrl}`);
  socket.connect(config.zmqPullUrl);
  router.addClient('pull',socket);
//  socket.on('message',(msg)=>{
//    console.log(`Message received ${msg}`);
//    console.log(typeof msg);
//    console.log(JSON.parse(msg));
//  });
  return () => socket.close();
};

const initActionPush = (config,router) => {
  const socket = zmq.socket("push");
  console.log(`Publisher connected to ${config.zmqPushUrl}`);
  socket.bindSync(config.zmqPushUrl);
  router.addClient('push',socket);
  return ()=> socket.close();
};

const init = (config,opts={}) => {
  const exitFns = []
  if(opts.push){
    exitFns.push(initActionPush(config,pubSubRouter));
  }
  if(opts.pull){
    exitFns.push(initActionPull(config,pubSubRouter));
  }
  //register to on regeive message
  pubSubRouter.init();
  return exitFns;
};

const push = pubSubRouter.push.bind(pubSubRouter);

module.exports = {
  init,
  push
};
