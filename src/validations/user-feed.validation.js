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

const getUserFeedInfo = {
  body: Joi.object().keys({
    articleIds: Joi.array().items(Joi.string().custom(objectId)),
  }).min(1),
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
const markArticleRead = {
  body: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    value: Joi.boolean(),
    updateReadLater: Joi.boolean().default(false)
  }),
};

const markUserFeedRead = {
  body: Joi.object().keys({
    userFeedId: Joi.string().custom(objectId).required(),
    value: Joi.boolean(),
    updateReadLater: Joi.boolean().default(false)
  }),
};

const markArticleReadLater = {
  body: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    value: Joi.boolean(),
    updateRead: Joi.boolean().default(true)
  }),
};

const markUserFeedReadLater = {
  body: Joi.object().keys({
    userFeedId: Joi.string().custom(objectId).required(),
    value: Joi.boolean(),
    updateRead: Joi.boolean().default(true)
  }),
};

module.exports = {
  getUserFeed,
  getUserFeeds,
  getUserFeedCount,
  getUserFeedInfo,
  markUserFeed,
  markArticle,
  markUserFeedRead,
  markArticleRead,
  markUserFeedReadLater,
  markArticleReadLater,
};
