const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createUserTag = {
  body: Joi.object().keys({
    tag: Joi.string().required(),
    user: Joi.string().required(),
    displayName: Joi.string(),
    subscribed: Joi.boolean().default(true),
  }),
};

const getUserTags = {
  query: Joi.object().keys({
    user: Joi.string().custom(objectId),
    tag: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};


const getUserTag = {
  params: Joi.object().keys({
    userTagId: Joi.string().custom(objectId),
  }),
};

const updateUserTag = {
  params: Joi.object().keys({
    userTagId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      displayName: Joi.string(),
      subscribed: Joi.boolean()
    }),
};

const deleteUserTag = {
  params: Joi.object().keys({
    userTagId: Joi.string().custom(objectId),
  }),
};

const subscribeTag = {
  body: Joi.object().keys({
    tagId: Joi.string().custom(objectId),
    displayName: Joi.string()
  }),
};
const unSubscribeTag = {
  body: Joi.object().keys({
    tagId: Joi.string().custom(objectId),
  }),
};
module.exports = {
  createUserTag,
  getUserTags,
  getUserTag,
  updateUserTag,
  deleteUserTag,
  subscribeTag,
  unSubscribeTag
};


