const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createTag = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    displayName: Joi.string(),
    isEquity: Joi.boolean(),
    aliases: Joi.array().items(Joi.string()),
    approved: Joi.boolean(),
  }),
};

const getTags = {
  query: Joi.object().keys({
    name: Joi.string(),
    approved: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const searchTags = {
  query: Joi.object().keys({
    q: Joi.string().allow(""),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    all: Joi.boolean(),
    paginate: Joi.boolean(),
  }),
};

const getTag = {
  params: Joi.object().keys({
    tagId: Joi.string().custom(objectId),
  }),
};

const updateTag = {
  params: Joi.object().keys({
    tagId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    displayName: Joi.string(),
    aliases: Joi.array().items(Joi.string()),
    approved: Joi.boolean(),
  }),
};

const deleteTag = {
  params: Joi.object().keys({
    tagId: Joi.string().custom(objectId),
  }),
};

const changeTagAlias = {
  params: Joi.object().keys({
    tagId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      add: Joi.array().items(Joi.string()).min(1),
      remove: Joi.array().items(Joi.string()).min(1),
    })
    .min(1),
};

module.exports = {
  createTag,
  getTags,
  getTag,
  updateTag,
  deleteTag,
  changeTagAlias,
  searchTags,
};
