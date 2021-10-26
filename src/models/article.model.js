const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const clean = require('../utils/clean');
const getDomain = require('../utils/getDomain');

const articleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sTitle: {
      type: String,
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
    //article fetched from feeds are partial and complete when fetched
    isPartial:{
      type: Boolean,
      default: true
    },
    pubDate: {
      type: Date,
    },
    pubDateRaw : {
      type: String
    },
    retrieveDate: {
      type: Date,
      default: Date.now
    },
    feed:{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Feed'
    },
    //source can be web crawl or feed crawl.All sources
    //from which article has been populated
    sources:[{
      type: String,
      enum : ['feed','web']
    }],
    tags : [{
      type: String,
      lowercase: true
    }],
    //When an article has no individual link. Link will be null 
    //and pageLink will be set
    pageLink: {
      type: String
    },
    link: {
      type: String
    },
    attachmentLink: {
      type: String,
    },
    sourceDomain: {
      type: String,
    },
    topics: [{
      type: String
    }],
    trash: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    similar: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Article'
    }],
    related: [{
      type: mongoose.Schema.Types.ObjectId,
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

articleSchema.pre('save',async function (){
  const article = this;
  if(article.isNew || article.isModified('title')){
    //strip html tags
    article.title = article.title.replace(/<[^>]+>/g,' ');
    article.sTitle = clean(article.title).toLowerCase();
  }
  if(article.isNew){
    const link = article.link || article.pageLink || article.attachmentLink;
    article.sourceDomain = getDomain(link);
    article.retrieveDate = new Date();
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
  condition.retrieveDate = {"$gte":qDate};
  const article = await this.findOne(condition);
  return !!article;
};


/**
 * @typedef Article
 */
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;


