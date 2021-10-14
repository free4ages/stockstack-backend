const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createEquity = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    company: Joi.string().required(),
    aliases: Joi.array().items(Joi.string()),
    nseCode: Joi.string(),
    bseCode: Joi.string(),
    sectors: Joi.array().items(Joi.string()),
    approved: Joi.boolean(),
  }),
};

const getEquities = {
  query: Joi.object().keys({
    code: Joi.string(),
    approved: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const searchEquities = {
  query: Joi.object().keys({
    q: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getEquity = {
  params: Joi.object().keys({
    equityId: Joi.string().custom(objectId),
  }),
};

const updateEquity = {
  params: Joi.object().keys({
    equityId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().required(),
      company: Joi.string().required(),
      aliases: Joi.array().items(Joi.string()),
      nseCode: Joi.string(),
      bseCode: Joi.string(),
      sectors: Joi.array().items(Joi.string()),
      approved: Joi.boolean(),
    }),
};

const deleteEquity = {
  params: Joi.object().keys({
    equityId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createEquity,
  getEquities,
  getEquity,
  searchEquities,
  updateEquity,
  deleteEquity,
};


