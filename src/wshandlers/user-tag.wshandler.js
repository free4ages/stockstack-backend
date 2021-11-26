const { userFeedService, userTagService, tagService } = require('../services');
const logger = require('../config/logger');

const userTagHandler = (io, socket) => {
  const tagFeedCount = () => {
    userFeedService
      .getFeedCountGroupByTag({
        user: socket.user._id,
        isRead: false,
        deleted: false,
      })
      .then((data) => {
        //console.log(data);
        socket.emit('tag:counts', data);
      });
  };

  const subscribeAllUserTags = (data) => {
    logger.debug('Subscribing to tags');
    userTagService.getTagsOfUser(socket.user).then(({ results }) => {
      logger.debug(`Joining ${results.length} rooms`);
      results.forEach((tag) => {
        //logger.debug(`Joining room for ${tag.name}`);
        socket.join(tag.name);
      });
      socket.emit('tag:subscribeall',{status:'ok',count:results.length,success:true})
    });
  };

  const subscribeTag = (data) => {
    const {tagId} = data;
    const user = socket.user;
    const getUserTag = userTagService.getUserTagByIds(user._id,tagId)
    const getTag = tagService.getTagById(tagId)
    Promise.all([getUserTag,getTag]).then(values =>{
      const [userTag,tag] = values;
      if(userTag && tag){
        socket.join(tag.name);
        socket.emit('tag:subscribe',{status:'ok',success:true});
      }
      else{
        socket.emit('tag:subscribe',{status:'notok',success:false});
      }
    })
  }
  const unSubscribeTag = (data) => {
    const {tagId} = data;
    tagService.getTagById(tagId).then(tag =>{
      if(tag){
        socket.leave(tag.name);
        socket.emit('tag:unsubscribe',{status:'ok',success:true});
      }
      else{
        socket.emit('tag:unsubscribe',{status:'notok',success:false});
      }
    })
  }

  socket.on('tag:counts', tagFeedCount);
  socket.on('tag:subscribeall', subscribeAllUserTags);
  socket.on('tag:subscribe', subscribeTag);
  socket.on('tag:unsubscribe', unSubscribeTag);
};

module.exports = userTagHandler;
