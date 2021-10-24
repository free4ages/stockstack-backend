const Joi = require('joi');
const log = {
  payload: Joi.object().keys({
    articleId: Joi.string().required(),
  })
}

const create = {
  payload: Joi.object().keys({
    articleId: Joi.string().required(),
    tags:Joi.array().items(Joi.string()),
    equities:Joi.array().items(Joi.string()),
  })
};

const addTags = {
  payload: Joi.object().keys({
    articleId: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    executed: Joi.boolean()
  }),
};

module.exports = {
  create,
  addTags
};
