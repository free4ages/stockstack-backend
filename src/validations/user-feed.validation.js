const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getUserFeed = {
  params: Joi.object().keys({
    userFeedId: Joi.string().custom(objectId),
  }),
};

const getUserFeeds = {
  query: Joi.object().keys({
    readLater: Joi.boolean(),
    q: Joi.string(),
    recommended: Joi.boolean(),
    isRead: Joi.boolean(),
    important: Joi.boolean(),
    deleted: Joi.boolean().default(false),
    tagNames: Joi.string(),
    sourceDomain: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUserFeedCount = {
  query: Joi.object().keys({
    readLater: Joi.boolean(),
    recommended: Joi.boolean(),
    isRead: Joi.boolean(),
    important: Joi.boolean(),
    deleted: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string().custom(objectId)),
    sourceDomain: Joi.string(),
  }),
};

const markUserFeed = {
  body: Joi.object().keys({
    userFeedId: Joi.string().custom(objectId).required(),
    value: Joi.boolean(),
  }),
};

const markArticle = {
  body: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    value: Joi.boolean(),
  }),
};

module.exports = {
  getUserFeed,
  getUserFeeds,
  getUserFeedCount,
  markUserFeed,
  markArticle,
};
