const { tagService, articleService } = require('../services');
const { Tag } = require('../models');
const pubsub = require('../pubsub');
const { ioEmitter } = require('../socketio');

const log = async (payload, req) => {
  console.log(`Logging PULL:`, payload);
};

const searchTag = async (payload) => {
  const chunkSize = 20;
  let tmp;
  const article = await articleService.getArticleById(payload.articleId, { raise: true });
  const tags = await Tag.find({ approved: true, autoSearch: true, disabled: false }, { _id: 1 });
  for (let i = 0; i < tags.length; i += chunkSize) {
    tmp = tags.slice(i, i + chunkSize).map((tag) => tag.id);
    pubsub.push('article.searchTagSet', { articleId: article.id, tagIds: tmp });
  }
};

const searchTagSet = async (payload) => {
  const { articleId, tagIds } = payload;
  const tags = await articleService.searchArticleTagsByTagId(articleId, tagIds);
  const newTags = await articleService.addArticleTags(articleId, tags);
};

const publishNewArticle = async (payload) => {
  const {articleId} = payload;
  const article = await articleService.getArticleById(articleId,{raise:true});
  ioEmitter()
    .to('ARTICLES')
    .emit('article:new',article);
}

module.exports = {
  log,
  searchTag,
  searchTagSet,
  publishNewArticle,
};
