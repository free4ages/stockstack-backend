const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { tagService, userTagService } = require('../services');
const clean = require('../utils/clean');

const createTag = catchAsync(async (req, res) => {
  const tag = await tagService.createTag(req.body);
  res.status(httpStatus.CREATED).send(tag);
});

const getTags = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await tagService.queryTags(filter, options);
  res.send(result);
});

const getTag = catchAsync(async (req, res) => {
  const tag = await tagService.getTagById(req.params.tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  res.send(tag);
});

const searchTags = catchAsync(async (req, res) => {
  const query = req.query.q || '';
  const filter = { approved: true };
  if (query) {
    const reg = clean(query, { lowercase: true }).replace(/ +/g, ' *');
    filter.aliases = new RegExp(`^${reg}`);
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'all', 'paginate']);
  const result = await tagService.queryTags(filter, options);
  res.send(result);
});

const updateTag = catchAsync(async (req, res) => {
  const tag = await tagService.updateTagById(req.params.tagId, req.body);
  res.send(tag);
});

const deleteTag = catchAsync(async (req, res) => {
  await tagService.deleteTagById(req.params.tagId);
  res.status(httpStatus.NO_CONTENT).send();
});

const changeTagAlias = catchAsync(async (req, res) => {
  const added = await tagService.changeTagAlias(req.params.tagId, req.body);
  res.send({ success: added });
});

const getMyTags = catchAsync(async (req, res) => {
  let result;
  if (!req.user) {
    result = await tagService.getDefaultTags();
  } else {
    result = await userTagService.getTagsOfUser(req.user);
  }
  res.send(result);
});

module.exports = {
  createTag,
  getTags,
  getMyTags,
  getTag,
  updateTag,
  deleteTag,
  searchTags,
  changeTagAlias,
};
