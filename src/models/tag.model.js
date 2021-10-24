const mongoose = require('mongoose');
const _ = require('lodash');
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

//presave actions
tagSchema.pre('save',async function(){
  const tag = this;
  tag.aliases = tag.aliases || [];
  tag.aliases = _.uniq(tag.aliases.map((alias)=> clean(alias).toLowerCase()));
  if(tag.isNew){
    tag.name = clean(tag.name).toLowerCase();
    if(!_.includes(tag.aliases,tag.name)){
      tag.aliases.push(tag.name);
    }
  }
  console.log("After Pre Save Hook");
  console.log("Tag Get Changes:", tag.getChanges());
  console.log("======================")
});
tagSchema.post('save',async function(doc){
  console.log("After Post Save Hook");
  console.log("Tag Get Changes:", this.getChanges());
  console.log("Doc Get Changes:", doc.getChanges());
  console.log("======================")
});


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

tagSchema.statics.getValidatedTags = async function (tagList) {
  if(!tagList) return [];
  const tags = tagList.map((tag) => clean(tag).toLowerCase())
  let dbTags = [];
  if(tags.length){
    dbTags = await this.find({$or:[{aliases:{$in:tags}},{name:{$in:tags}}]});
  }
  return dbTags.map((tag) => tag.name)
}

/**
 * @typedef Tag
 */
const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;

