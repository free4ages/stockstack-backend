class BaseBuilder {
  constructor(entry, feed) {
    this.feed = feed;
    this.entry = entry;
    this.article = {};
    this.construct(entry);
  }

  templateArticle() {
    return {
      feed: this.feed.id,
    };
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

  extractShortText(entry) {
    return '';
  }

  extractFullText(entry) {
    return '';
  }

  extractEquities(entry) {
    return [];
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
    const article = this.templateArticle();
    article.title = this.extractTitle(entry);
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
