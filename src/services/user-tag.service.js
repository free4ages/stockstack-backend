const httpStatus = require('http-status');
const _ = require('lodash');
const { UserTag, User, Tag } = require('../models');
const { userService, tagService } = require('.');
const ApiError = require('../utils/ApiError');
const clean = require('../utils/clean');
const pick = require('../utils/pick');

/**
 * Convert UserId or TagId
 * @param {User|ObjectId} user
 * @param {Tag|ObjectId} tag
 * @param {Object} updateBody
 * @returns {Promise<UserTag>}
 */
const resolveUserTag = async ({ userId, tagId, raise = true }) => {
  const [user, tag] = await Promise.all([
    userService.getUserInstance(userId, { raise }),
    tagService.getTagInstance(tagId, { raise }),
  ]);
  return { user, tag };
};

/**
 * Create UserTag
 * @param {User} user
 * @param {Tag} tag
 * @param {Object} body
 * @returns {Promise<UserTag>}
 */
const createUserTag = async ({ userId, tagId, ...body }) => {
  const { user, tag } = await resolveUserTag({ userId, tagId, raise: true });
  const data = {
    tagName: tag.name,
    displayName: tag.displayName,
    tag: tag._id,
    user: user._id,
  };
  Object.assign(data, pick(body, ['subscribed', 'pinned', 'displayName']));
  const userTag = await UserTag.create(data);
  if (!tag.autoSearch) {
    await tagService.changeAutoSearch(tag._id, true);
  }
  return userTag;
};

/**
 * Subscribe User to Tag
 * @param {User|id} userId
 * @param {Tag|id} tagId
 * @param {Object} body
 * @returns {Promise<UserTag>}
 */
const addTagToUser = async (user, tagId, body = {}) => {
  let userTag = await getUserTagByIds(user._id, tagId);
  if (!userTag) {
    body.subscribed = true;
    userTag = await createUserTag({ userId: user, tagId, ...body });
  } else if (!userTag.subscribed) {
    Object.assign(userTag, pick(body, ['displayName']));
    userTag.subscribed = true;
    userTag.save();
  }
  return true;
};

const removeTagFromUser = async (user, tagId) => {
  const userTag = await getUserTagByIds(user._id, tagId);
  if (userTag) {
    await userTag.remove();
  }
  return userTag;
};

const getTagsOfUser = async (user, filter = {}) => {
  filter.user = user._id;
  const userTags = await UserTag.find(filter).lean().populate('tag');
  // convert with tag as primary
  const results = userTags.map((userTag) => {
    const { tag } = userTag; // userTag is a default js object
    tag.id = tag._id;
    delete tag._id;
    const userTagFields = ['displayName', 'subscribed', 'pinned'];
    Object.assign(tag, pick(userTag, userTagFields));
    return tag;
  });
  return { results };
};

const getUserTagsOfUser = async (user, filter = {}, options = {}) => {
  const { populate = false } = options;
  filter.user = user._id;
  let query = UserTag.find(filter);
  if (populate) {
    query = query.populate('tag');
  }
  return await query;
};

const getUserTagsofTag = async (tag, filter = {}, options = {}) => {
  const { populate = false } = options;
  filter.tag = tag._id;
  let query = UserTag.find(filter);
  if (populate) {
    query = query.populate('user');
  }
  return query;
};
/**
 * Query for userTags
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUserTags = async (filter, options) => {
  const userTags = await UserTag.paginate(filter, options);
  return userTags;
};

/**
 * Get userTag by id
 * @param {ObjectId} id
 * @returns {Promise<UserTag>}
 */
const getUserTagById = async (id) => {
  return UserTag.findById(id);
};

/**
 * Get userTag by userId and tagId
 * @param {ObjectId} userId
 * @param {ObjectId} tagId
 * @returns {Promise<UserTag>}
 */
const getUserTagByIds = async (userId, tagId) => {
  return UserTag.findOne({ user: userId, tag: tagId });
};

/**
 * Get userTag by userId and tagId
 * @param {ObjectId} userId
 * @param {string} tagName
 * @returns {Promise<UserTag>}
 */
const getUserTagByTagName = async (userId, tagName) => {
  return await UserTag.findOne({ user: userId, tagName });
};

/**
 * Update userTag by id
 * @param {ObjectId} userTagId
 * @param {Object} updateBody
 * @returns {Promise<UserTag>}
 */
const updateUserTagById = async (userTagId, updateBody) => {
  const userTag = await getUserTagById(userTagId);
  if (!userTag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'UserTag not found');
  }
  if (updateBody.name && (await UserTag.isNameTaken(updateBody.name, userTagId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'UserTag already exists');
  }
  Object.assign(userTag, updateBody);
  await userTag.save();
  return userTag;
};

/**
 * Delete userTag by id
 * @param {ObjectId} userTagId
 * @returns {Promise<UserTag>}
 */
const deleteUserTagById = async (userTagId) => {
  const userTag = await getUserTagById(userTagId);
  if (!userTag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'UserTag not found');
  }
  await userTag.remove();
  return userTag;
};

module.exports = {
  addTagToUser,
  removeTagFromUser,
  getUserTagById,
  getUserTagByIds,
  getTagsOfUser,
  getUserTagsOfUser,
  getUserTagsofTag,
  queryUserTags,
  updateUserTagById,
  deleteUserTagById,
};
