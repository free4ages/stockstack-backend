const _ = require('lodash');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { articleService } = require('../services');

const makeFilterQuery = (obj) => {
  const filter = pick(obj, ['tagNames', 'sourceDomain', 'q']);
  if (filter.tagNames) {
    filter.tags = { $in: filter.tagNames.toLowerCase().split(',') };
    delete filter.tagNames;
  }
  if (filter.q) {
    filter.$text = { $search: filter.q };
    delete filter.q;
  }
  return filter;
};

const createArticle = catchAsync(async (req, res) => {
  const { article } = await articleService.createArticle(req.body, {
    skipValidation: true,
  });
  res.status(httpStatus.CREATED).send(article);
});

const createManyArticles = catchAsync(async (req, res) => {
  const result = await articleService.createManyArticles(req.body, {
    skipValidation: true,
  });
  res.status(httpStatus.CREATED).send(result);
});

const getArticles = catchAsync(async (req, res) => {
  const filter = makeFilterQuery(req.query);
  filter.archived = filter.archived || false;
  filter.trash = filter.trash || false;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'paginate', 'all']);
  if (options.sortBy === 'default') {
    options.sortBy = 'pubDate:desc';
  }
  const result = await articleService.queryArticles(filter, options);
  res.send(result);
});

const searchArticles = catchAsync(async (req, res) => {
  const filter = pick(req.query, []);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'paginate', 'all']);
  const result = await articleService.searchArticles(req.query.q, filter, options);
  res.send(result);
});

const getArticle = catchAsync(async (req, res) => {
  const article = await articleService.getArticleById(req.params.articleId);
  if (!article) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Article not found');
  }
  res.send(article);
});

const updateArticle = catchAsync(async (req, res) => {
  const article = await articleService.updateArticleById(req.params.articleId, req.body);
  res.send(article);
});

const deleteArticle = catchAsync(async (req, res) => {
  await articleService.deleteArticleById(req.params.articleId);
  res.status(httpStatus.NO_CONTENT).send();
});

const searchArticleTags = catchAsync(async (req, res) => {
  const { articleId, tagIds, tagNames } = req.body;
  const tags = _.isEmpty(tagNames)
    ? await articleService.searchArticleTagsByTagId(articleId, tagIds)
    : await articleService.searchArticleTagsByTagName(articleId, tagNames);
  res.send(tags);
});

const addArticleTags = catchAsync(async (req, res) => {
  const { articleId, tagIds, tagNames, manual=true} = req.body;
  const newTags = _.isEmpty(tagNames)
    ? await articleService.addArticleTagsByTagId(articleId, tagIds,{manual})
    : await articleService.addArticleTagsByTagName(articleId, tagNames,{manual});
  const newTagNames = newTags.map((tag) => tag.name);
  res.send({ success: true, added: newTagNames });
});

const removeArticleTags = catchAsync(async (req, res) => {
  const { articleId, tagIds, tagNames ,manual=true} = req.body;
  const newTags = _.isEmpty(tagNames)
    ? await articleService.removeArticleTagsByTagId(articleId, tagIds,{manual})
    : await articleService.removeArticleTagsByTagName(articleId, tagNames,{manual});
  const newTagNames = newTags.map((tag) => tag.name);
  res.send({ success: true, removed: newTagNames });
});

const markArticlePinned = catchAsync(async (req, res) => {
  const { user } = req;
  const { articleId, addTags,removeTags,pinForAll } = req.body;
  const result={};
  if(addTags && addTags.length){
    const result1 = await articleService.pinArticleForTags(articleId, addTags, {},{doPinArticle:pinForAll})
    result['addCount'] = result1.modified;
  }
  if(removeTags && removeTags.length){
    const result2 = await articleService.unPinArticleForTags(articleId, removeTags, { })
    result['removeCount'] = result2.modified;
  }
  result['success'] = true;
  res.send(result);
});

const editArticle = catchAsync(async (req, res) => {
  const {articleId,displayTitle="",shortText="",editFeed=true} = req.body;
  const article = await articleService.editArticleContent(articleId,{displayTitle,shortText},{doEditFeedArticleContent:editFeed});
  res.send(article);
});

const markArticleDeleted = catchAsync(async (req, res) => {
  const { articleId, value, deleteForAll=true } = req.body;
  const result = value
    ? await articleService.markArticleAsDeleted(articleId,{},{doDeleteFeed:deleteForAll})
    : await articleService.markArticleAsUnDeleted(articleId);
  res.send(result);
});

const markArticlesSimilar = catchAsync(async (req,res) => {
  const {articleIds,updateFeeds=true} = req.body;
  const result = await articleService.markArticlesSimilar(articleIds,{doUpdateFeedCluster:updateFeeds});
  res.send(result);
});

module.exports = {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  searchArticles,
  createManyArticles,
  searchArticleTags,
  addArticleTags,
  removeArticleTags,
  markArticlePinned,
  markArticleDeleted,
  editArticle,
  markArticlesSimilar
};
