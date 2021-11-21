const _ = require('lodash');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { articleService } = require('../services');

const makeFilterQuery = (obj) => {
  const filter = pick(obj, [
    'tagNames',
    'sourceDomain',
    'q',
  ]);
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
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'paginate', 'all']);
  if(options.sortBy==="default"){
    options.sortBy = "pubDate:desc";
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
  const { articleId, tagIds, tagNames } = req.body;
  const newTags = _.isEmpty(tagNames)
    ? await articleService.addArticleTagsByTagId(articleId, tagIds)
    : await articleService.addArticleTagsByTagName(articleId, tagNames);
  const newTagNames = newTags.map((tag) => tag.name);
  res.send({ success: true, added: newTagNames });
});

const removeArticleTags = catchAsync(async (req, res) => {
  const { articleId, tagIds, tagNames } = req.body;
  const newTags = _.isEmpty(tagNames)
    ? await articleService.removeArticleTagsByTagId(articleId, tagIds)
    : await articleService.removeArticleTagsByTagName(articleId, tagNames);
  const newTagNames = newTags.map((tag) => tag.name);
  res.send({ success: true, removed: newTagNames });
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
};
