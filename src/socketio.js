const SocketIO = require('socket.io');
const IOEmitter = require('socket.io-emitter');
const { createClient } = require('redis');
const redisAdapter = require('@socket.io/redis-adapter');
const { authorize } = require('@thream/socketio-jwt');
const logger = require('./config/logger');
const { User } = require('./models');

const onConnection = (io, handlers) => (socket) => {
  console.log('Client Connected');
  handlers.map((handler) => {
    handler(io, socket);
  });
  socket.on('disconnect', () => console.log('Client Disconnected'));
};

const _init = (server, config, handlers) => {
  const pubClient = createClient({ url: config.redis.url });
  const subClient = pubClient.duplicate();
  const io = SocketIO(server, {
    cors: {
      origin: config.webUrl,
      methods: ['GET', 'POST'],
    },
  });
  io.adapter(redisAdapter(pubClient, subClient));
  io.use(
    authorize({
      secret: config.jwt.secret,
      onAuthentication: async (decodedToken) => {
        const user = await User.findById(decodedToken.sub);
        if (!user) {
          throw new Error('Invalid Token');
        }
        return user;
      },
    })
  );
  io.on('connection', onConnection(io, handlers));
  return io;
};
let ioInstance;
let ioEmitterInstance;

const init = (server, config, handlers) => {
  ioInstance = _init(server, config, handlers);
  return ioInstance;
};

const initEmitter = (config) => {
  logger.info(`SocketIo Emitter connected to ${config.redis.url}`);
  ioEmitterInstance = IOEmitter(config.redis.url);
  return ioEmitterInstance;
};
module.exports = {
  init,
  initEmitter,
  io: () => ioInstance,
  ioEmitter: () => ioEmitterInstance,
};
