const httpStatus = require('http-status');
const _ = require('lodash');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');
const clean = require('../utils/clean');

/**
 * Convert tagId to Tag
 * @param {ObjectId|Tag} tagId
 * @returns {Promise<Tag>}
 */
const getTagInstance = async (tagId, options) => {
  if (!(tagId instanceof Tag)) {
    return await getTagById(tagId, options);
  }
  return tagId;
};

/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
  if (await Tag.isNameTaken(tagBody.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name already exists');
  }
  return Tag.create(tagBody);
};

/**
 * Query for tags
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTags = async (filter, options) => {
  const tags = await Tag.paginate(filter, options);
  return tags;
};

/**
 * Query for default tags
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const getDefaultTags = async () => {
  const options = { all: true };
  const filter = { defaultShow: true, approved: true, disabled:false };
  const tags = await Tag.paginate(filter, options);
  return tags;
};

/**
 * Get tag by id
 * @param {ObjectId} id
 * @returns {Promise<Tag>}
 */
const getTagById = async (id, { raise = false } = {}) => {
  const tag = await Tag.findById(id);
  if (!tag && raise) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  return tag;
};

const getManyTagById = async (ids) => {
  if (!ids || !ids.length) return [];
  return Tag.find({ _id: { $in: ids } });
};

/**
 * Get tag by name
 * @param {string} name
 * @returns {Promise<Tag>}
 */
const getTagByName = async (name) => {
  name = clean(name).toLowerCase();
  return Tag.findOne({ $or: [{ aliases: name }, { name }] });
};

const getManyTagByName = async (names) => {
  if (!names || !names.length) return [];
  names = names.map((name) => clean(name).toLowerCase());
  return await Tag.find({ $or: [{ aliases: { $in: names } }, { name: { $in: names } }] });
};

/**
 * Update tag by id
 * @param {ObjectId} tagId
 * @param {Object} updateBody
 * @returns {Promise<Tag>}
 */
const updateTagById = async (tagId, updateBody) => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  if (updateBody.name && (await Tag.isNameTaken(updateBody.name, tagId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tag already exists');
  }
  Object.assign(tag, updateBody);
  await tag.save();
  return tag;
};

/**
 * Delete tag by id
 * @param {ObjectId} tagId
 * @returns {Promise<Tag>}
 */
const deleteTagById = async (tagId) => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  await tag.remove();
  return tag;
};

/**
 * Change flag for auto search of tag in article
 * @param {ObjectId} tagId
 * @param {Boolean} value
 * @returns {Boolean}
 */
const changeAutoSearch = async (tagId, value) => {
  const result = await Tag.updateOne({ _id: tagId }, { $set: { autoSearch: value } });
  return !!result.matchedCount;
};

/**
 * Update The lastUpdated Date for tags when an article
 * is tagged with these tags
 * @param {[ObjectId]} tagId
 * @returns {Boolean}
 */
const updateArticleAdded = async (tagIds) => {
  const result = await Tag.updateMany({ _id: { $in: tagIds } }, { $set: { lastUpdated: new Date() } });
  return !!result.matchedCount;
};

const changeTagAlias = async (tagId, body) => {
  let addAliases = body.add || [];
  let removeAliases = body.remove || [];
  if (_.isString(addAliases)) addAliases = [addAliases];
  if (_.isString(removeAliases)) removeAliases = [removeAliases];
  addAliases = addAliases.map((alias) => {
    return clean(alias).toLowerCase();
  });
  removeAliases = removeAliases.map((alias) => {
    return clean(alias).toLowerCase();
  });
  let tag;
  if (addAliases) {
    tag = await Tag.updateOne({ _id: tagId }, { $addToSet: { aliases: { $each: addAliases } } });
  }
  if (removeAliases) {
    tag = await Tag.updateOne({ _id: tagId }, { $pull: { aliases: { $in: removeAliases } } });
  }
  return !!tag.matchedCount;
};

module.exports = {
  getTagInstance,
  createTag,
  queryTags,
  getDefaultTags,
  getTagById,
  getTagByName,
  getManyTagById,
  getManyTagByName,
  updateTagById,
  deleteTagById,
  changeTagAlias,
  changeAutoSearch,
  updateArticleAdded,
};
