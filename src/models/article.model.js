const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const clean = require('../utils/clean');

const articleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sTitle: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    shortText: {
      type: String,
      default: ""
    },
    fullText: {
      type: String,
      default: ""
    },
    pubDate: {
      type: Date,
      default: Date.now
    },
    addDate: {
      type: Date,
      default: Date.now
    },
    equities: [{
      type:String,
      uppercase: true
    }],
    tags : [{
      type: String,
      lowercase: true
    }],
    source: {
      type: String
    },
    topic: {
      type: String
    },
    link: {
      type: String
    },
    attachmentLink: {
      type: String,
    },
    trash: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    similar: [{
      type: Schema.Types.ObjectId,
      ref:'Article'
    }],
    related: [{
      type: Schema.Types.ObjectId,
      ref:'Article'
    }]
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
articleSchema.plugin(toJSON);
articleSchema.plugin(paginate);

// index searchable fields
articleSchema.index({
  title: "text",
  shortText: "text",
  fullText: "text",
},{
  weights:{
    title: 5,
    shortText: 3,
    fullText: 2
  }
});

/**
 * Check if title or url is already present
 * @param {string} title - The article's title
 * @returns {Promise<boolean>}
 */
articleSchema.statics.doExist = async ({title="",link="",nDays=365}) => {
  title = clean(title).toLowerCase();
  if(!title && !link) return true;
  let condition = {};
  if(title && link){
    condition = {"$or":[{sTitle:title,link:link}]}
  } else if(title){
    condition = {sTitle:title}
  } else if(link){
    condition = {link:link}
  }
  let qDate = new Date();
  qDate.setDate(qDate.getDate()-nDays)
  condition[addDate:{"$gte":qDate}];
  const article = await this.findOne(condition);
  return !!article;
};


/**
 * @typedef Article
 */
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;


