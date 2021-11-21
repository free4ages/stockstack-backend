/* eslint class-methods-use-this: 0 */
/* eslint no-unused-vars: 0 */
class BaseBuilder {
  constructor(entry, feed,config={}) {
    this.feed = feed;
    this.entry = entry;
    this.article = {};
    this.config = config;
  }

  extractPubDate(entry) {
    return null;
  }

  extractPubDateRaw(entry) {
    return '';
  }

  extractTitle(entry) {
    return '';
  }
  extractDisplayTitle(entry){
    return '';
  }

  extractShortText(entry) {
    return '';
  }

  extractFullText(entry) {
    return '';
  }

  extractTags(entry) {
    return [];
  }

  extractTopics(entry) {
    return [];
  }

  extractLink(entry) {
    return '';
  }

  extractAttachmentLink(entry) {
    return '';
  }

  construct(entry) {
    const article = {};
    entry = entry || this.entry;
    article.title = this.extractTitle(entry);
    article.displayTitle = this.extractDisplayTitle(entry);
    article.shortText = this.extractShortText(entry);
    article.fullText = this.extractFullText(entry);
    article.pubDate = this.extractPubDate(entry);
    article.pubDateRaw = this.extractPubDateRaw(entry);
    // article.equities = this.extractEquities(entry);
    article.tags = this.extractTags(entry);
    article.topics = this.extractTopics(entry);
    article.link = this.extractLink(entry);
    article.attachmentLink = this.extractAttachmentLink(entry);
    this.article = article;
  }
}
module.exports = BaseBuilder;
