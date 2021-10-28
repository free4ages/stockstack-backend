const Joi = require('joi');

const crawl = {
  payload: Joi.object().keys({
    feedId: Joi.string().required(),
  }),
};

module.exports = {
  crawl,
};
