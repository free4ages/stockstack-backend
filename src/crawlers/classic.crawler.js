const crypto = require('crypto');
const RssParser = require('rss-parser');
const logger = require('../config/logger');
const config = require('../config/config');
const { fetchWithTimeout, fetch } = require('../utils/fetchWithTimeout');
const CrawlerError = require('../utils/CrawlerError');
const { feedService, articleService } = require('../services');
const ClassicBuilder = require('./builders/classic.builder');

class ClassicCrawler {
  constructor(feed) {
    this.feed = feed;
    this.response = null;
    this._text = null;
    this.articles = []; // holds builder instances
    this._hasError = false;
  }

  async getContentHash() {
    if (this.response) {
      const text = this._text;
      if (text) {
        return `ss/${crypto.createHash('md5').update(text).digest('hex')}`;
      }
    }
    return '';
  }

  getHeaders(modifiedHeaders = true) {
    const { feed } = this;
    const headers = {
      'User-Agent': config.crawler.userAgent,
    };
    if (modifiedHeaders) {
      if (feed.lastModified) headers['If-Modified-Since'] = feed.lastModified.toGMTString();
      if (feed.etag && !feed.etag.startsWith('ss/')) headers['If-None-Match'] = feed.etag;
      if (headers['If-Modified-Since'] || headers['If-None-Match']) {
        headers['A-IM'] = 'feed';
      }
    }
    return headers;
  }

  computeExpire() {
    const { feed } = this;
    const now = new Date();
    return new Date(now.getTime() + feed.crawlIntervalInSec * 1000);
  }

  async isCacheHit(response) {
    function etagMatch(tag1, tag2) {
      return tag1 === tag2;
    }
    if (
      response.status === 304 ||
      response.status === 226 ||
      response.headers.get('etag') === this.feed.etag ||
      etagMatch(await this.getContentHash(), this.feed.etag)
    ) {
      logger.info('Cache hit found');
      return true;
    }
    return false;
  }

  async setFeedError(error) {
    const { feed } = this;
    const info = {
      lastError: `${error}`,
      errorCount: feed.errorCount + 1,
      lastRetrieved: new Date(),
      expires: this.computeExpire(),
    };
    return feedService.updateFeedById(feed.id, info);
  }

  async parseFeedResponse() {
    const text = this._text;
    const rssParser = new RssParser();
    const parsed = await rssParser.parseString(text);
    return parsed;
  }

  async buildArticles(response) {
    const parsed = await this.parseFeedResponse(response);
    if (!parsed) return [];
    const articles = parsed.items.map((entry) => {
      return new ClassicBuilder(entry, this.feed);
    }, this);
    return articles;
  }

  async createArticles() {
    if (this._hasError) {
      logger.info('Cannot create article since crwaler has error');
      return;
    }
    const { feed } = this;
    const buildArticles = this.articles;
    if (!buildArticles || !buildArticles.length) return {};
    const articles = buildArticles.map((buildArticle) => buildArticle.article);
    const result = await articleService.createManyArticles(articles);
    this.articles = [];

    if (result.createdCount) {
      logger.debug(`${result.createdCount} new articles created`);
      await feedService.addFetchCount(feed.id, result.createdCount);
    }
    if (result.error) {
      logger.info('Crawler encountered error while making article entry');
      await this.setFeedError(result.error);
      return;
    }
    await this.cleanFeed(this.response);
  }

  async crawl({ force = false, create = true }) {
    const { feed } = this;
    let response;
    try {
      response = await this.request(!force);
      this.response = response;
      this._text = await response.text();
      if (response.status >= 400 && response.status <= 600) {
        throw new CrawlerError(`Error fetching feed ${feed.link}`, response.status);
      }
    } catch (err) {
      this._hasError = true;
      await this.setFeedError(err);
      throw err;
    }
    let articles = [];
    if (force || !(await this.isCacheHit(response))) {
      // always the case when no request header sent
      articles = await this.buildArticles(response);
      this.articles = articles;
    }
    if (create) {
      this.createArticles(articles);
    }
    return articles;
  }

  async cleanFeed(response) {
    // Will reset the errors counters on a feed that have known errors
    const info = {};
    const now = new Date();
    const { headers } = response;
    info.errorCount = 0;
    info.lastError = '';
    info.lastRetrieved = now;
    info.expires = this.computeExpire();
    info.etag = headers.get('etag') || (await this.getContentHash());
    if (headers.get('last-modified')) {
      const lastModified = new Date(headers.get('last-modified'));
      if (!Number.isNaN(lastModified.getTime())) {
        info.lastModified = lastModified;
      }
    }
    logger.info(`Resetting errors with info ${JSON.stringify(info)}`);
    this.response = null;
    this._text = null;
    return feedService.updateFeedById(this.feed.id, info);
  }

  async request() {
    return fetchWithTimeout(this.feed.link, { headers: this.getHeaders(), timeout: config.crawler.timeout });
    //console.log(this.getHeaders());
    //return await fetch(this.feed.link, { headers: this.getHeaders() });
  }
}

module.exports = ClassicCrawler;
