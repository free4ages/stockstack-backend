const Joi = require('joi');
const { objectId } = require('../validations/custom.validation');

const sendToFeedOnTagAdd = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    // tagIds: Joi.array().items(Joi.string().custom(objectId).required()),
    tagNames: Joi.array().items(Joi.string().required()),
  }),
};

const removeFromFeedOnTagRemove = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    // tagIds: Joi.array().items(Joi.string().custom(objectId).required()),
    tagNames: Joi.array().items(Joi.string().required()),
  }),
};

module.exports = {
  sendToFeedOnTagAdd,
  removeFromFeedOnTagRemove,
};
