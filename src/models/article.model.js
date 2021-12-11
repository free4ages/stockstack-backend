const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const clean = require('../utils/clean');
const getDomain = require('../utils/getDomain');

const articleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    displayTitle: {
      type: String,
      default: '',
    },
    sTitle: {
      type: String,
      trim: true,
      lowercase: true,
    },
    shortText: {
      type: String,
      default: '',
    },
    fullText: {
      type: String,
      default: '',
    },
    // article fetched from feeds are partial and complete when fetched
    isPartial: {
      type: Boolean,
      default: true,
    },
    pubDate: {
      type: Date,
      index: true,
    },
    pubDateIsDefault: {
      type: Boolean,
      default: false,
    },
    pubDateRaw: {
      type: String,
    },
    retrieveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    feed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feed',
    },
    clusterId: {
      type: String,
    },
    // source can be web crawl or feed crawl.All sources
    // from which article has been populated
    sources: [
      {
        type: String,
        enum: ['feed', 'web'],
      },
    ],
    tags: [
      {
        type: String,
        lowercase: true,
      },
    ],
    vAddedTags:[{
      type:String,
    }],
    vRemovedTags:[{
      type:String,
    }],
    // When an article has no individual link. Link will be null
    // and pageLink will be set
    pageLink: {
      type: String,
    },
    link: {
      type: String,
      default:"",
    },
    attachmentLink: {
      type: String,
      default:"",
    },
    sourceDomain: {
      type: String,
    },
    topics: [
      {
        type: String,
      },
    ],
    trash: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    similar: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
    related: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
    pinTags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
articleSchema.plugin(toJSON);
articleSchema.plugin(paginate);

// index searchable fields
articleSchema.index(
  {
    title: 'text',
    shortText: 'text',
    fullText: 'text',
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

articleSchema.pre('save', async function () {
  const article = this;
  if (article.isNew) {
    // strip html tags
    article.title = article.title.replace(/<[^>]+>/g, ' ');
    article.sTitle = clean(article.title).toLowerCase();
    article._id = new mongoose.Types.ObjectId();
    article.clusterId = article._id.toString();
  }
  if (article.isNew) {
    const link = article.link || article.pageLink || article.attachmentLink;
    article.sourceDomain = getDomain(link);
    if (!article.retrieveDate) {
      article.retrieveDate = new Date();
    }

    if (!article.pubDate) {
      article.pubDate = new Date();
      article.pubDateIsDefault = true;
    }
  }
});

/**
 * Check if title or url is already present
 * @param {string} title - The article's title
 * @returns {Promise<boolean>}
 */
articleSchema.statics.doExist = async ({ title = '', link = '', nDays = 365 }) => {
  title = clean(title).toLowerCase();
  if (!title && !link) return true;
  let condition = {};
  if (title && link) {
    condition = { $or: [{ sTitle: title, link }] };
  } else if (title) {
    condition = { sTitle: title };
  } else if (link) {
    condition = { link };
  }
  const qDate = new Date();
  qDate.setDate(qDate.getDate() - nDays);
  condition.retrieveDate = { $gte: qDate };
  const article = await this.findOne(condition);
  return !!article;
};

/**
 * @typedef Article
 */
const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
