const logger = require('../config/logger');

const articleHandler = (io, socket) => {
  const subscribeNewArticle = () => {
    logger.debug('Joining Articles');
    socket.join('ARTICLES');
    socket.emit('article:subscribe', { status: 'ok', success: true });
  };
  const unSubscribeNewArticle = () => {
    logger.debug('Leaving Articles');
    socket.leave('ARTICLES');
    socket.emit('article:unsubscribe', { status: 'ok', success: true });
  };
  socket.on('article:subscribe', subscribeNewArticle);
  socket.on('article:unsubscribe', unSubscribeNewArticle);
};
module.exports = articleHandler;
