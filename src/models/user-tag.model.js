const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const userTagSchema = mongoose.Schema(
  {
    tagName: {
      type: String,
      required: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscribed: {
      type: Boolean,
      default: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userTagSchema.index({ user: 1, tag: 1 }, { unique: true });
// add plugin that converts mongoose to json
userTagSchema.plugin(toJSON);
userTagSchema.plugin(paginate);

/**
 * @typedef UserTag
 */
const UserTag = mongoose.model('UserTag', userTagSchema);

module.exports = UserTag;
