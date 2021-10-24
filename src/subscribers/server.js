const zmq = require('zeromq')

const initActionSubscription = (config,router) => {
  const socket = zmq.socket("pull");
  console.log(`Consumer connected to ${config.zmqWorkerSubscriptionUrl}`);
  socket.connect(config.zmqWorkerSubscriptionUrl);
  router.addClient('pull',socket);
//  socket.on('message',(msg)=>{
//    console.log(`Message received ${msg}`);
//    console.log(typeof msg);
//    console.log(JSON.parse(msg));
//  });
  return () => socket.close();
};

module.exports = {
  initActionSubscription,
};
