const zmq = require('zeromq');

const zmqClient = zmq.socket('push');
const initActionPublish = (config) => {
  console.log(`Publisher connected to ${config.zmqAppPublishUrl}`);
  zmqClient.bindSync(config.zmqAppPublishUrl);
  return () => zmqClient.close();
};

module.exports = {
  zmqClient,
  initActionPublish,
};
