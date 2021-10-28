const _ = require('lodash');
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const clean = require('../utils/clean');

const equitySchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    company: {
      type: String,
      trim: true,
      required: true,
    },
    aliases: [
      {
        type: String,
        lowercase: true,
      },
    ],
    nseCode: {
      type: String,
      uppercase: true,
    },
    bseCode: {
      type: String,
      uppercase: true,
    },
    sectors: [
      {
        type: String,
      },
    ],
    approved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// presave actions
equitySchema.pre('save', async function () {
  const equity = this;
  equity.aliases = equity.aliases || [];
  equity.aliases = _.uniq(equity.aliases.map((alias) => clean(alias).toLowerCase()));
  equity.code = clean(equity.code).toUpperCase();
  if (!_.includes(equity.aliases, equity.code.toLowerCase())) {
    equity.aliases.push(equity.code.toLowerCase());
  }
  if (!_.includes(equity.aliases, clean(equity.company).toLowerCase())) {
    equity.aliases.push(clean(equity.company).toLowerCase());
  }
});

// add plugin that converts mongoose to json
equitySchema.plugin(toJSON);
equitySchema.plugin(paginate);

// index searchable fields
equitySchema.index({
  aliases: 'text',
});

/**
 * Check if name is taken
 * @param {string} name - The equity's name
 * @returns {Promise<boolean>}
 */
equitySchema.statics.isNameTaken = async function (name, excludeEquityId) {
  name = clean(name).toLowerCase();
  if (!name) return true;
  const equity = await this.findOne({ aliases: name, _id: { $ne: excludeEquityId } });
  return !!equity;
};

equitySchema.statics.getValidatedEquities = async function (equityList) {
  const equities = equityList.map((equity) => clean(equity).toLowerCase());
  let dbEquities = [];
  if (equities.length) {
    dbEquities = await this.find({ aliases: { $in: equities } });
  }
  return dbEquities.map((equity) => equity.code);
};

/**
 * @typedef Equity
 */
const Equity = mongoose.model('Equity', equitySchema);

module.exports = Equity;
