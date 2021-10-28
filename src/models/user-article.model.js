const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const noteSchema = mongoose.Schema(
  {
    text: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const userArticleSchema = mongoose.Schema(
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
    bucket: [
      {
        type: String,
        enum: ['important', 'alert', 'noted'],
        default: 'feed',
      },
    ],
    notes: [noteSchema],
    isRead: {
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
    },
    shortText: {
      type: String,
      default: '',
    },
    pubDate: {
      type: Date,
    },
    retrieveDate: {
      type: Date,
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
  },
  {
    timestamps: true,
  }
);

userArticleSchema.index({ user: 1, article: 1 }, { unique: true });
// add plugin that converts mongoose to json
userArticleSchema.plugin(toJSON);
userArticleSchema.plugin(paginate);

/**
 * @typedef UserArticle
 */
const UserArticle = mongoose.model('UserArticle', userArticleSchema);

module.exports = UserArticle;
