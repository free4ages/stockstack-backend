const logger = require('../../config/logger');
const BaseBuilder = require('./base');

class ClassicBuilder extends BaseBuilder {
  templateArticle() {
    return {
      feed: this.feed.id,
      sources: ['feed'],
      pageLink: this.feed.link,
      retrieveDate: new Date(),
    };
  }

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
        const date = new Date(entry.pubDate);
        if (isNaN(date.getTime())) {
          return null;
        }
        return date;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  extractLink(entry) {
    return entry.link;
  }

  extractTopics(entry) {
    return this.feed.topics || [];
  }
}
module.exports = ClassicBuilder;
