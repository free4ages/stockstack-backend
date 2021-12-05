const httpStatus = require('http-status');
// const logger = require('../config/logger');
const { StockPrice } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const clean = require('../utils/clean');

const checkIfExists = async ({ stockId, stockName, nseCode, bseCode }) => {
  const conditions = [];
  if (stockId) {
    return StockPrice.findOne({ stockId });
  }
  if (stockName) {
    conditions.push({ stockName: clean(stockName, { allowSpace: false }).toLowerCase() });
  }
  if (nseCode) {
    conditions.push({ nseCode: nseCode.toUpperCase() });
  }
  if (bseCode) {
    conditions.push({ bseCode: bseCode.toUpperCase() });
  }
  return StockPrice.findOne({ $or: conditions });
};
const createStockPrice = async (body) => {
  const { stockId, stockName, nseCode = '', bseCode = '' } = body;
  const existing = await checkIfExists({ stockId, stockName, nseCode, bseCode });
  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Stock already exists');
  }
};
