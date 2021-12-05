/* eslint class-methods-use-this: 0 */
const BaseBuilder = require('./base');

class CnbcTvBuilder extends BaseBuilder {
  extractTitle(entry) {
    return (entry.headline || '').trim();
  }

  extractShortText() {
    return '';
  }

  extractPubDateRaw(entry) {
    return (entry.creation_date || '').toString();
  }

  extractPubDate(entry) {
    // November 28 2021 02:09 PM IST
    if (entry.creation_date) {
      const dateStr = entry.creation_date.toString().replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,'$1-$2-$3 $4:$5:$6');
      const date = new Date(dateStr);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }

  extractLink(entry) {
    if (entry.posturl) {
      return `https://www.cnbctv18.com/${entry.posturl}`;
    }
    return '';
  }

  extractTopics(entry) {
    let topic = [];
    if (entry.tags_slug && entry.tags_slug.length) {
      topic = topic.concat(entry.tags_slug);
    }
    if (entry.categories && entry.categories.length) {
      topic = topic.concat(entry.categories);
    }
    return topic;
  }
}
module.exports = CnbcTvBuilder;
