const mongoose = require('mongoose');
const _ = require('lodash');
const { toJSON, paginate } = require('./plugins');
const clean = require('../utils/clean');
const toTitleCase = require('../utils/toTitleCase');

const tagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: {
        unique: true,
      },
    },
    displayName: {
      type: String,
    },
    isEquity: {
      type: Boolean,
      default: false,
    },
    aliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],
    approved: {
      type: Boolean,
      default: false,
    },
    defaultShow: {
      type: Boolean,
      default: true,
    },
    // Whether this tag will participate in auto search
    autoSearch: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // save last time an article is added
    lastUpdated: {
      type: Date,
      default: new Date(0),
    },
  },
  {
    timestamps: true,
  }
);

// presave actions
tagSchema.pre('save', async function () {
  const tag = this;
  tag.aliases = tag.aliases || [];
  tag.aliases = _.uniq(tag.aliases.map((alias) => clean(alias).toLowerCase()));
  if (!this.displayName) {
    this.displayName = toTitleCase(this.name);
  }
  if (tag.isNew) {
    tag.name = clean(tag.name, { allowSpace: false }).toLowerCase();
    if (!_.includes(tag.aliases, tag.name)) {
      tag.aliases.push(tag.name);
    }
  }
});

// add plugin that converts mongoose to json
tagSchema.plugin(toJSON);
tagSchema.plugin(paginate);

// index searchable fields
// tagSchema.index({
//  aliases: 'text',
// });

/**
 * Check if name is taken
 * @param {string} name - The tag's name
 * @returns {Promise<boolean>}
 */
tagSchema.statics.isNameTaken = async function (name, excludeTagId) {
  name = clean(name).toLowerCase();
  if (!name) return true;
  const tag = await this.findOne({ aliases: name, _id: { $ne: excludeTagId } });
  return !!tag;
};

tagSchema.statics.getValidatedTags = async function (tagList) {
  if (!tagList) return [];
  const tags = tagList.map((tag) => clean(tag).toLowerCase());
  let dbTags = [];
  if (tags.length) {
    dbTags = await this.find({ $or: [{ aliases: { $in: tags } }, { name: { $in: tags } }] });
  }
  return dbTags.map((tag) => tag.name);
};

/**
 * @typedef Tag
 */
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
