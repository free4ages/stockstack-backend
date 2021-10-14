const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
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
      required: true
    },
    aliases: [{
      type: String,
      lowercase: true,
    }],
    nseCode:{
      type: String,
      uppercase: true,
    },
    bseCode:{
      type: String,
      uppercase: true,
    },
    sectors:[{
      type: String
    }],
    approved: {
      type: Boolean,
      default:true
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
equitySchema.plugin(toJSON);
equitySchema.plugin(paginate);

//index searchable fields
equitySchema.index({
  aliases: "text",
});

/**
 * Check if name is taken
 * @param {string} name - The equity's name
 * @returns {Promise<boolean>}
 */
equitySchema.statics.isNameTaken = async function (name,excludeEquityId) {
  name = clean(name).toLowerCase();
  if(!name) return true;
  const equity = await this.findOne({aliases:name,_id: {$ne: excludeEquityId}});
  return !!equity;
};

/**
 * @typedef Equity
 */
const Equity = mongoose.model('Equity', equitySchema);

module.exports = Equity;


