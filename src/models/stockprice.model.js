const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const stockPriceSchema = mongoose.schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    index: true,
    required: true,
    unique: true,
  },
  stockName: {
    type: String,
    required: true,
  },
  nseCode: {
    type: String,
    default: '',
  },
  bseCode: {
    type: String,
    default: '',
  },
  lastRetrieved: {
    type: Date,
    default: new Date(0),
  },
  fetchIntervalInSec: {
    type: Number,
    default: 3600, // default 1hr
  },
  expires: {
    type: Date,
    default: new Date(0),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  todayStart: {
    open: { type: Number },
    lastClose: { type: Number },
    fetchTime: { type: Date },
  },
  archived: {
    type: Boolean,
    default: false,
  },
  current: {
    price: { type: Number },
    volume: { type: Number },
    time: { type: Date, default: Date.now },
    fetchTime: { type: Date, default: Date.now },
    change: { type: Number },
    changePercent: { type: Number },
  },
  prices: [
    {
      type: Object, // format same as current with open and lastClose price
    },
  ],
});

const StockPrice = mongoose.model('StockPrice', stockPriceSchema);

module.exports = StockPrice;
