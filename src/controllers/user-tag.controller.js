const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userTagService } = require('../services');

const createUserTag = catchAsync(async (req, res) => {
  const userTag = await userTagService.createUserTag(req.body);
  res.status(httpStatus.CREATED).send(userTag);
});

const getUserTags = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['user', 'tag']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userTagService.queryUserTags(filter, options);
  res.send(result);
});

const getUserTag = catchAsync(async (req, res) => {
  const userTag = await userTagService.getUserTagById(req.params.userTagId);
  if (!userTag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'UserTag not found');
  }
  res.send(userTag);
});

const updateUserTag = catchAsync(async (req, res) => {
  const userTag = await userTagService.updateUserTagById(req.params.userTagId, req.body);
  res.send(userTag);
});

const deleteUserTag = catchAsync(async (req, res) => {
  await userTagService.deleteUserTagById(req.params.userTagId);
  res.status(httpStatus.NO_CONTENT).send();
});

const subscribeTag = catchAsync(async (req, res) => {
  const { user } = req;
  const { tagId } = req.body;
  await userTagService.addTagToUser(user, tagId, req.body);
  res.send({ success: true });
});

const unSubscribeTag = catchAsync(async (req, res) => {
  const { user } = req;
  const { tagId } = req.body;
  await userTagService.removeTagFromUser(user, tagId);
  res.send({ success: true });
});

const getAuthUserTags = catchAsync(async (req, res) => {
  const { user } = req;
  const userTags = await userTagService.getUserTagsOfUser(user);
  res.send(userTags);
});

module.exports = {
  createUserTag,
  getUserTags,
  getUserTag,
  updateUserTag,
  deleteUserTag,
  subscribeTag,
  unSubscribeTag,
  getAuthUserTags,
};
