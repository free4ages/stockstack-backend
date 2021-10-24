const Joi = require('joi');
const pick = require('../utils/pick');
const PubSubError = require('../utils/PubSubError');

const defaultSchema= {
  path: Joi.string().required(),
  //payload : Joi.object()
}

const validate = (schema) => (req, next) => {
  const userSchema = pick(schema, ['path', 'payload']);
  const validSchema = Object.assign({},defaultSchema,userSchema);
  const object = pick(req, Object.keys(validSchema));
  const finalSchema = Joi.compile(validSchema);
  const { value, error } = finalSchema
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    let errorMessage = error.details.map((details) => details.message).join(', ');
    errorMessage += ` in req ${JSON.stringify(req)}. Expected ${JSON.stringify(finalSchema.describe())}`;
    return next(new PubSubError(errorMessage,400));
  }
  Object.assign(req, value);
  return next();
};
module.exports = validate;
