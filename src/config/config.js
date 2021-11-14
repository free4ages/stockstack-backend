const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    SOCKET_PORT: Joi.number().default(3006),
    WORKER_PORT: Joi.number().default(3001),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(1000).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    ZMQ_PULL_URL: Joi.string().description('zeromq url for pull'),
    ZMQ_PUSH_URL: Joi.string().description('zeromq url for push'),
    WEB_URL: Joi.string().description('web url'),
    REDIS_URL: Joi.string().description('Redis Url').default('redis://localhost:6379'),
    FEED_MIN_EXPIRES: Joi.number()
      .default(60 * 30)
      .description('The minimum number of seconds between two fetchs of the same feed'),
    FEED_MAX_EXPIRES: Joi.number()
      .default(7 * 24 * 60 * 60)
      .description('The maximum number of seconds between two fetchs of the same feed'),
    CRAWLER_TIMEOUT: Joi.number().default(60).description('Timeout delay for requests executed by the crawler in seconds.'),
    CRAWLER_USER_AGENT: Joi.string()
      .default('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36')
      .description('Timeout delay for requests executed by the crawler in seconds.'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  socketPort: envVars.SOCKET_PORT,
  workerPort: envVars.WORKER_PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      // useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  feed: {
    minExpires: envVars.FEED_MIN_EXPIRES,
    maxExpires: envVars.FEED_MAX_EXPIRES,
  },
  crawler: {
    timeout: envVars.CRAWLER_TIMEOUT,
    userAgent: envVars.CRAWLER_USER_AGENT,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  zeroMQ: {
    pullUrl: envVars.ZMQ_PULL_URL,
    pushUrl: envVars.ZMQ_PUSH_URL,
  },
  webUrl: envVars.WEB_URL,
  redis: {
    url: envVars.REDIS_URL
  }
};
