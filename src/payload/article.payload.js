const Joi = require('joi');
const { objectId } = require('../validations/custom.validation');

const searchTag = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
  }),
};

const searchTagSet = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    tagIds: Joi.array().items(Joi.string().custom(objectId).required()).required(),
  }),
};

module.exports = {
  searchTag,
  searchTagSet,
};
