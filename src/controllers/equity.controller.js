const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { equityService } = require('../services');

const createEquity = catchAsync(async (req, res) => {
  const equity = await equityService.createEquity(req.body);
  res.status(httpStatus.CREATED).send(equity);
});

const getEquities = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await equityService.queryEquities(filter, options);
  res.send(result);
});

const getEquity = catchAsync(async (req, res) => {
  const equity = await equityService.getEquityById(req.params.equityId);
  if (!equity) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Equity not found');
  }
  res.send(equity);
});

const searchEquities = catchAsync(async (req, res) => {
  const filter = { $text: { $search: req.query.q || '' } };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await equityService.queryEquities(filter, options);
  res.send(result);
});

const updateEquity = catchAsync(async (req, res) => {
  const equity = await equityService.updateEquityById(req.params.equityId, req.body);
  res.send(equity);
});

const deleteEquity = catchAsync(async (req, res) => {
  await equityService.deleteEquityById(req.params.equityId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createEquity,
  getEquities,
  searchEquities,
  getEquity,
  updateEquity,
  deleteEquity,
};
