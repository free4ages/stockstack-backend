const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const userFeedSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
    },
    readLater: {
      type: Boolean,
      default: false,
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    notesCount: {
      type: Number,
      default: 0,
    },
    important: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    readDate: {
      type: Date,
    },
    // article related data
    title: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    shortText: {
      type: String,
      default: '',
    },
    pubDate: {
      type: Date,
      index:true
    },
    retrieveDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    tags: [
      {
        type: String,
        lowercase: true,
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    sourceDomain: {
      type: String,
    },
    attachmentLink: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

userFeedSchema.index({ user: 1, article: 1 }, { unique: true });
userFeedSchema.index(
  {
    title: 'text',
    shortText: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 5,
      shortText: 3,
      fullText: 2,
    },
  }
);
// add plugin that converts mongoose to json
userFeedSchema.plugin(toJSON);
userFeedSchema.plugin(paginate);

/**
 * @typedef UserFeed
 */
const UserFeed = mongoose.model('UserFeed', userFeedSchema);

module.exports = UserFeed;
