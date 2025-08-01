const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const getDomain = require('../utils/getDomain');

const feedSchema = mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      required: true,
    },
    source: {
      type: String,
    },
    siteLink: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    crawler: {
      type: String,
      required: true,
    },
    crawlIntervalInSec: {
      type: Number,
      default: 900,
    },
    crawlStrategy: {
      type: String,
      enum: ['fixed', 'frequency'],
    },
    etag: {
      type: String,
      default: '',
    },
    topics: [
      {
        type: String,
      },
    ],
    lastRetrieved: {
      type: Date,
      default: new Date(0),
    },
    lastModified: {
      type: Date,
    },
    expires: {
      type: Date,
      default: new Date(0),
    },
    filterRules: [
      {
        type: String,
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
    skipAfterDays: {
      type: Number,
      default: 5,
    },
    lastError: {
      type: String,
      default: '',
    },
    lastParserError: {
      type: String,
      default: '',
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    fetchCounts: [
      {
        fdate: { type: Date, required: true },
        num: { type: Number, required: true },
      },
    ],
    lastCache: [
      {
        title: { type: String },
        link: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// presave actions
feedSchema.pre('save', async function () {
  const feed = this;
  if (feed.isNew && feed.link) {
    feed.source = getDomain(feed.link);
  }
});

// add plugin that converts mongoose to json
feedSchema.plugin(toJSON);
feedSchema.plugin(paginate);

/**
 * Check if title or url is already present
 * @param {string} title - The feed's title
 * @returns {Promise<boolean>}
 */
feedSchema.statics.doExist = async function (link, excludeFeedId) {
  const feed = await this.findOne({ link, _id: { $ne: excludeFeedId } });
  return !!feed;
};

/**
 * @typedef Feed
 */
const Feed = mongoose.model('Feed', feedSchema);

module.exports = Feed;
