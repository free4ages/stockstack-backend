const { userFeedService, userTagService } = require('../services');
const logger = require('../config/logger');

const userFeedHandler = (io, socket) => {
//  const feedTagCount = () => {
//    userFeedService
//      .getFeedCountGroupByTag({
//        user: socket.user._id,
//        isRead: false,
//        deleted: false,
//      })
//      .then((data) => {
//        //console.log(data);
//        socket.emit('feed:counts', data);
//      });
//  };
//
//  const subscribeAllFeed = (data) => {
//    logger.debug('Subscribing to feeds');
//    userTagService.getTagsOfUser(socket.user).then(({ results }) => {
//      logger.debug(`Joining ${results.length} rooms`);
//      results.forEach((tag) => {
//        //logger.debug(`Joining room for ${tag.name}`);
//        socket.join(tag.name);
//      });
//      socket.emit('feed:subscribeall',{status:'ok',count:results.length})
//    });
//  };
//
//  socket.on('feed:counts', feedTagCount);
//  socket.on('feed:subscribeall', subscribeAllFeed);
};

module.exports = userFeedHandler;
