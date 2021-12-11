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

const pinArticle = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    // tagIds: Joi.array().items(Joi.string().custom(objectId).required()),
    tagNames: Joi.array().items(Joi.string().required()),
  }),
};

const articleEdited = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
    title: Joi.string(),
    shortText: Joi.string(),
  }),
};

const articleDeleted = {
  payload: Joi.object().keys({
    articleId: Joi.string().custom(objectId).required(),
  }),
};

const clusterUpdated = {
  payload: Joi.object().keys({
    clusterId: Joi.string()
  }),
}
module.exports = {
  sendToFeedOnTagAdd,
  removeFromFeedOnTagRemove,
  pinArticle,
  articleEdited,
  articleDeleted,
  clusterUpdated,
};
