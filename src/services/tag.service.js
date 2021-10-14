const httpStatus = require('http-status');
const _ = require('lodash')
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');
const clean = require('../utils/clean');

const _formatTagBody = (tagBody) => {
  let body = {...tagBody};
  body.aliases = body.aliases || [];
  body.aliases = _.uniq(body.aliases.map((alias)=> clean(alias).toLowerCase()));
  body.name = clean(body.name).toLowerCase();
  if(!_.includes(body.aliases,body.name)){
    body.aliases.push(body.name);
  }
  return body
}

/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
  if (await Tag.isNameTaken(tagBody.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name already exists');
  }
  tagBody = _formatTagBody(tagBody);
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
 * Get tag by id
 * @param {ObjectId} id
 * @returns {Promise<Tag>}
 */
const getTagById = async (id) => {
  return Tag.findById(id);
};

/**
 * Get tag by name
 * @param {string} name
 * @returns {Promise<Tag>}
 */
const getTagByName = async (name) => {
  name = clean(name).toLowerCase();
  return Tag.findOne({aliases: name});
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
  Object.assign(tag, _formatTagBody(updateBody));
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

module.exports = {
  createTag,
  queryTags,
  getTagById,
  getTagByName,
  updateTagById,
  deleteTagById,
};

