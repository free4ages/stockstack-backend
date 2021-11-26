const httpStatus = require('http-status');
const { Equity } = require('../models');
const ApiError = require('../utils/ApiError');
const clean = require('../utils/clean');

/**
 * Create a equity
 * @param {Object} equityBody
 * @returns {Promise<Equity>}
 */
const createEquity = async (equityBody) => {
  if (await Equity.isNameTaken(equityBody.code)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Code already exists');
  }
  return Equity.create(equityBody);
};

/**
 * Query for equities
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryEquities = async (filter, options) => {
  const equities = await Equity.paginate(filter, options);
  return equities;
};

/**
 * Get equity by id
 * @param {ObjectId} id
 * @returns {Promise<Equity>}
 */
const getEquityById = async (id) => {
  return Equity.findById(id);
};

/**
 * Get equity by name
 * @param {string} name
 * @returns {Promise<Equity>}
 */
const getEquityByName = async (name) => {
  name = clean(name).toLowerCase();
  return Equity.findOne({ aliases: name });
};

/**
 * Update equity by id
 * @param {ObjectId} equityId
 * @param {Object} updateBody
 * @returns {Promise<Equity>}
 */
const updateEquityById = async (equityId, updateBody) => {
  const equity = await getEquityById(equityId);
  if (!equity) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Equity not found');
  }
  if (updateBody.name && (await Equity.isNameTaken(updateBody.name, equityId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Equity already exists');
  }
  Object.assign(equity, updateBody);
  await equity.save();
  return equity;
};

/**
 * Delete equity by id
 * @param {ObjectId} equityId
 * @returns {Promise<Equity>}
 */
const deleteEquityById = async (equityId) => {
  const equity = await getEquityById(equityId);
  if (!equity) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Equity not found');
  }
  await equity.remove();
  return equity;
};

module.exports = {
  createEquity,
  queryEquities,
  getEquityById,
  getEquityByName,
  updateEquityById,
  deleteEquityById,
};
