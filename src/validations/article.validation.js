const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createArticle = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    shortText: Joi.string().allow(''),
    fullText: Joi.string().allow(''),
    isPartial: Joi.boolean(),
    pubDate: Joi.date(),
    retrieveDate: Joi.date(),
    pubDateRaw: Joi.string().allow(''),
    feed: Joi.string(),
    sources: Joi.array().items(Joi.string().valid('feed', 'web')),
    tags: Joi.array().items(Joi.string()),
    topics: Joi.array().items(Joi.string()),
    link: Joi.string().uri().allow(''),
    pageLink: Joi.string().uri().allow(''),
    attachmentLink: Joi.string().uri().allow(''),
  }),
};

const createManyArticles = {
  body: Joi.array().items(createArticle.body),
};

const getArticles = {
  query: Joi.object().keys({
    title: Joi.string(),
    source: Joi.string(),
    approved: Joi.boolean(),
    sortBy: Joi.string().default('retrieveDate:desc'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const searchArticles = {
  query: Joi.object().keys({
    q: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getArticle = {
  params: Joi.object().keys({
    articleId: Joi.string().custom(objectId),
  }),
};

const updateArticle = {
  params: Joi.object().keys({
    articleId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    aliases: Joi.array().items(Joi.string()),
    approved: Joi.boolean(),
  }),
};

const deleteArticle = {
  params: Joi.object().keys({
    articleId: Joi.string().custom(objectId),
  }),
};

const searchArticleTags = {
  body: Joi.object().keys({
    articleId: Joi.string().custom(objectId),
    tagIds: Joi.array().items(Joi.string().custom(objectId).required()),
    tagNames: Joi.array().items(Joi.string().required()),
  }),
};

const addArticleTags = {
  body: Joi.object().keys({
    articleId: Joi.string().custom(objectId),
    tagIds: Joi.array().items(Joi.string().custom(objectId).required()),
    tagNames: Joi.array().items(Joi.string().required()),
  }),
};

module.exports = {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  createManyArticles,
  searchArticleTags,
};
