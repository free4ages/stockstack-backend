/* eslint class-methods-use-this: 0 */
const dateparser = require('any-date-parser');
const BaseBuilder = require('./base');

class ClassicBuilder extends BaseBuilder {
  extractTitle(entry) {
    return entry.title;
  }

  extractShortText(entry) {
    return entry.contentSnippet;
  }

  extractPubDateRaw(entry) {
    return entry.pubDate || '';
  }

  extractPubDate(entry) {
    if (entry.pubDate) {
      try {
        let date = new Date(entry.pubDate);
        if (Number.isNaN(date.getTime())) {
          const pubDateRaw = entry.pubDate.replace(/IST/i, '+0530');
          date = dateparser.fromString(pubDateRaw);
          if (Number.isNaN(date.getTime())) {
            return null;
          }
        }
        return date;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  extractLink(entry) {
    return (entry.link || '').trim();
  }

  extractTopics() {
    return this.feed.topics || [];
  }
}
module.exports = ClassicBuilder;
