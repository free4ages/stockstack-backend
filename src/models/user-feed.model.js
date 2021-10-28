const mongoose = require('mongoose');
const _ = require('lodash');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const clean = require('../utils/clean');
const {noteSchema} = require('./user-article.model');

const userFeedSchema = mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required: true
  },
  article:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Article',
    required: true
  },
  readLater: {
    type: Boolean,
    default: false
  },
  recommended:{
    type: Boolean,
    default:false
  },
  notesCount: {
    type: Number,
    default: 0 
  },
  important:{
    type: Boolean,
    default:false
  },
  isRead:{
    type: Boolean,
    default: false
  },
  readDate:{
    type: Date
  },
  //article related data
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: ""
  },
  shortText:{
    type: String,
    default: ""
  },
  pubDate: {
    type: Date
  },
  retrieveDate: {
    type: Date
  },
  tags : [{
    type: String,
    lowercase: true
  }],
  deleted: {
    type: Boolean,
    default: false,
  },
  sourceDomain: {
    type: String,
  }
},
{
    timestamps: true,
});

userFeedSchema.index({user:1,article:1},{unique:true});
// add plugin that converts mongoose to json
userFeedSchema.plugin(toJSON);
userFeedSchema.plugin(paginate);

/**
 * @typedef UserFeed
 */
const UserFeed = mongoose.model('UserFeed', userFeedSchema);

module.exports = UserFeed;

