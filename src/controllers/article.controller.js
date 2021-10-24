const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { articleService } = require('../services');

const createArticle = catchAsync(async (req, res) => {
  const {article,isNew} = await articleService.createArticle(req.body,{
    triggerTagSearch:false,
    triggerTagAdded:true,
    skipValidation:true
  });
  res.status(httpStatus.CREATED).send(article);
});

const createManyArticles = catchAsync(async (req, res) => {
  const result = await articleService.createManyArticles(req.body,{
    triggerTagSearch:false,
    triggerTagAdded:true,
    skipValidation:true
  });
  res.status(httpStatus.CREATED).send(result);
});

const getArticles = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await articleService.queryArticles(filter, options);
  res.send(result);
});

const getArticle = catchAsync(async (req, res) => {
  const article = await articleService.getArticleById(req.params.articleId);
  if (!article) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Article not found');
  }
  res.send(article);
});

const searchArticles = catchAsync(async (req, res)=>{
  const filter = {$text:{$search:req.query.q || ""}}
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await articleService.queryArticles(filter, options);
  res.send(result);
});

const updateArticle = catchAsync(async (req, res) => {
  const article = await articleService.updateArticleById(req.params.articleId, req.body);
  res.send(article);
});

const deleteArticle = catchAsync(async (req, res) => {
  await articleService.deleteArticleById(req.params.articleId);
  res.status(httpStatus.NO_CONTENT).send();
});

const changeArticleAlias = catchAsync(async (req,res) => {
  const added = await articleService.changeArticleAlias(req.params.articleId,req.body);
  res.send({success:added});
});


module.exports = {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  searchArticles,
  changeArticleAlias,
  createManyArticles,
};


