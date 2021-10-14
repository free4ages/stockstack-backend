const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const clean = require('../utils/clean');

const tagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    aliases: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    approved: {
      type: Boolean,
      default:false
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tagSchema.plugin(toJSON);
tagSchema.plugin(paginate);

//index searchable fields
tagSchema.index({
  aliases: "text",
});

/**
 * Check if name is taken
 * @param {string} name - The tag's name
 * @returns {Promise<boolean>}
 */
tagSchema.statics.isNameTaken = async function (name,excludeTagId) {
  name = clean(name).toLowerCase();
  if(!name) return true;
  const tag = await this.findOne({aliases:name,_id: {$ne: excludeTagId}});
  return !!tag;
};

/**
 * @typedef Tag
 */
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;

