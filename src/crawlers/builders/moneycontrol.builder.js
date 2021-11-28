/* eslint class-methods-use-this: 0 */
const dateparser = require('any-date-parser');
const BaseBuilder = require('./base');

class MoneyControlBuilder extends BaseBuilder {
  extractTitle(entry) {
    return (entry.title || "").trim();
  }

  extractShortText(entry) {
    return entry.desc || "";
  }

  extractPubDateRaw(entry) {
    return entry.pubDateRaw || '';
  }

  extractPubDate(entry) {
    //November 28 2021 02:09 PM IST
    if (entry.pubDateRaw) {
      let pubDateRaw = entry.pubDateRaw.trim();
      pubDateRaw = pubDateRaw.replace(/ IST/i,"");
      const date = dateparser.fromString(pubDateRaw);
      if(!Number.isNaN(date.getTime())){
        return new Date(date.getTime()-330*60000)
      }
      return null
    }
    return null;
  }

  extractLink(entry) {
    return (entry.link || "").trim();
  }

  extractTopics() {
    return this.feed.topics || [];
  }
}
module.exports = MoneyControlBuilder;

