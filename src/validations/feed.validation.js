const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFeed = {
  body: Joi.object().keys({
    link: Joi.string().uri().required(),
    title: Joi.string(),
    siteLink: Joi.string().uri(),
    description: Joi.string(),
    topics: Joi.array().items(Joi.string()),
    crawler: Joi.string().default('classic'),
    crawlIntervalInSec: Joi.number().integer(),
    crawlStrategy: Joi.string().valid('fixed', 'frequency'),
    disabled: Joi.boolean().default(false),
    filterRules: Joi.array().items(Joi.string()),
    skipAfterDays: Joi.number(),
  }),
};

const getFeeds = {
  query: Joi.object().keys({
    source: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getFeed = {
  params: Joi.object().keys({
    feedId: Joi.string().custom(objectId),
  }),
};
const crawlFeed = {
  body: Joi.object().keys({
    feedId: Joi.string().custom(objectId),
    skipDb: Joi.boolean().default(false),
    skipCache: Joi.boolean().default(false),
    create: Joi.boolean().default(true),
  }),
};

const updateFeed = {
  params: Joi.object().keys({
    feedId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    link: Joi.string().uri(),
    title: Joi.string(),
    siteLink: Joi.string().uri(),
    description: Joi.string(),
    topics: Joi.array().items(Joi.string()),
    crawler: Joi.string(),
    crawlIntervalInSec: Joi.number().integer(),
    crawlStrategy: Joi.string().valid('fixed', 'frequency'),
    disabled: Joi.boolean().default(false),
    filterRules: Joi.array().items(Joi.string()),
    skipAfterDays: Joi.number(),
  }),
};

const deleteFeed = {
  params: Joi.object().keys({
    feedId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createFeed,
  getFeeds,
  getFeed,
  updateFeed,
  deleteFeed,
  crawlFeed,
};
