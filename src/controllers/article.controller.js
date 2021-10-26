const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { articleService } = require('../services');

const createArticle = catchAsync(async (req, res) => {
  const {article,isNew} = await articleService.createArticle(req.body,{
    skipValidation:true
  });
  res.status(httpStatus.CREATED).send(article);
});

const createManyArticles = catchAsync(async (req, res) => {
  const result = await articleService.createManyArticles(req.body,{
    skipValidation:true
  });
  res.status(httpStatus.CREATED).send(result);
});

const getArticles = catchAsync(async (req, res) => {
  const filter = pick(req.query, []);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await articleService.queryArticles(filter, options);
  res.send(result);
});

const searchArticles = catchAsync(async (req, res) => {
  const filter = pick(req.query, []);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await articleService.searchArticles(req.query.q,filter, options);
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

const searchArticleTags = catchAsync(async (req,res)=>{
  const tags = await articleService.searchArticleTagsByTagName(req.body.articleId,req.body.tags)
  res.send(tags);
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
};


