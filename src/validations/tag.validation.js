const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createTag = {
  body: Joi.object().keys({
    name: Joi.string().required(),
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
    q: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
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
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
      aliases: Joi.array().items(Joi.string()),
      approved: Joi.boolean(),
    }),
};

const deleteTag = {
  params: Joi.object().keys({
    tagId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createTag,
  getTags,
  getTag,
  updateTag,
  deleteTag,
};

