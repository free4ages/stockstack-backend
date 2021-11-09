const _ = require('lodash');
const logger = require('../config/logger');
const { articleService, userFeedService } = require('../services');
const { UserFeed, UserTag, Tag, User } = require('../models');
const pubsub = require('../pubsub');

const sendToFeedOnTagAdd = async (payload) => {
  //console.log('Send To feed called', payload);
  const { articleId, tagIds, tagNames } = payload;
  const fetchTags = tagIds
    ? Tag.find({ _id: { $in: tagIds }, disabled: false, approved: true })
    : Tag.find({ name: { $in: tagNames }, disabled: false, approved: true });
  // convert ids to instance
  const [article, tags] = await Promise.all([articleService.getArticleInstance(articleId, { raise: true }), fetchTags]);
  //console.log(tags);
  if (!tags.length) return;

  const selectedTagIds = tags.map((tag) => tag._id);
  const selectedTagNames = tags.map((tag) => tag.name);
  //console.log(selectedTagNames);
  logger.debug(`Tags selected for feed ${selectedTagNames}`);

  const addTagsToExistingFeedTask = async () => {
    await UserFeed.updateMany({ article: article._id }, { $addToSet: { tags: { $each: selectedTagNames } } });
  };

  const addArticleinFeedTasks = async () => {
    // get all users subscribed to tags
    const subscribedUserIds = (await UserTag.find({ tag: { $in: selectedTagIds } }, { user: 1 })).map(
      (userTag) => userTag.user
    );
    //console.log('Subscribed UserIds', subscribedUserIds);
    // get all users in userIds who dont have article in feed
    const userIdswithArticle = (
      await UserFeed.find({ user: { $in: subscribedUserIds }, article: article._id }, { user: 1 })
    ).map((userFeed) => userFeed.user);
    //console.log('User Ids with article', userIdswithArticle);

    const userIdswithoutArticle = _.differenceWith(
      subscribedUserIds,
      userIdswithArticle,
      (a, b) => a.toString() === b.toString()
    );
    //console.log('User Ids without article', userIdswithoutArticle);

    const usersForFeedCreation = await User.find({ _id: { $in: userIdswithoutArticle }, active: true, blocked: false });
    //console.log('User Ids for feed cration', usersForFeedCreation);

    const tasks = usersForFeedCreation.map((user) => {
      return userFeedService.addArticleToUserFeed(user, article);
    });

    return Promise.allSettled(tasks);
  };

  await addArticleinFeedTasks();
  await addTagsToExistingFeedTask();
};

const removeFromFeedOnTagRemove = async (payload) => {
  const { articleId, tagNames } = payload;
  const result = await UserFeed.updateMany({ article: articleId }, { $pull: { tags: { $in: tagNames } } });
};
module.exports = {
  sendToFeedOnTagAdd,
  removeFromFeedOnTagRemove,
};
