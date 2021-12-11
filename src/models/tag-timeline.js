const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const tagTimeLineSchema = mongoose.schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true,
  },
  tag: {
    type: String,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default:"",
  },
  attachmentLink: {
    type: String,
    default:"",
  },
  shortText: {
    type: String,
    default: '',
  },
  pubDate: {
    type: Date,
    index: true,
  },
  retrieveDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
});
tagTimeLineSchema.plugin(toJSON);
tagTimeLineSchema.plugin(paginate);

const TagTimeLine = mongoose.model('TagTimeLine', tagTimeLineSchema);

module.exports = TagTimeLine;
