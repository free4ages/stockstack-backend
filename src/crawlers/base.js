const crypto = require('crypto');
const logger = require('../config/logger');
const config = require('../config/config');
const CrawlerError = require('../utils/CrawlerError');
const { feedService, articleService } = require('../services');
const formatAMPM = require('../utils/formatampm');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function asynTimeout(secs=60){
  return new Promise((resolve,reject)=>{
    setTimeout(()=> resolve(true),secs*1000);
  });
}

class BaseCrawler {
  parserClass = null;
  constructor(feed) {
    this.feed = feed;
    this._text = null;
    this._headers = {};
    this._status = null;
    this.parser = null; // holds parseFeed instances
    this._hasError = false;
    this.articles=[];
    this.skipDb = false;
  }

  async getContentHash() {
    if (this._text) {
      const text = this._text;
      return `ss/${crypto.createHash('md5').update(text).digest('hex')}`;
    }
    return '';
  }

  getDefaultHeaders(modifiedHeaders = true) {
    const { feed } = this;
    const headers = {
      //'User-Agent': config.crawler.userAgent,
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
    const variation = getRandomInt(0,20)-10;
    const crawlIntervalInSec = Math.round((1+(variation/100))*feed.crawlIntervalInSec);
    const scheduleTime = new Date(now.getTime() + crawlIntervalInSec * 1000);
    logger.debug(`Next fetch for ${feed.title} scheduled at ${formatAMPM(scheduleTime)}`)
    return scheduleTime;
  }

  async isCacheHit() {
    const resStatus = this._status;
    const resHeaders = this._headers;

    function etagMatch(tag1, tag2) {
      return tag1 === tag2;
    }
    if (
      resStatus === 304 ||
      resStatus === 226 ||
      resHeaders.etag === this.feed.etag ||
      etagMatch(await this.getContentHash(), this.feed.etag)
    ) {
      logger.info('Cache hit found');
      return true;
    }
    return false;
  }

  async setFeedError(error,disable=false) {
    if(this.skipDb) return;
    const { feed } = this;
    const info = {
      lastError: `${error}`,
      errorCount: feed.errorCount + 1,
      lastRetrieved: new Date(),
      expires: this.computeExpire(),
    };
    if(disable){
      info.disabled = true;
    }
    if(info.errorCount>=config.crawler.disableAfterErrorCount){
      info.disabled = true;
    }
    return feedService.updateFeedById(feed.id, info);
  }

  async create(articles){
    const result = await articleService.createManyArticles(articles);
    return result;
  }

  async createArticles() {
    if (this._hasError) {
      logger.info('Cannot create article since crwaler has error');
      return;
    }
    const { feed,articles } = this;
    if (!articles.length) return;
    const result = await this.create(articles);
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
  }
  async getResponse(){
    return {resText:'',resHeaders:{},resStatus:404};
  }
  async createCache(){
    if(this.parser){
      return await this.parser.getArticlesCache();
    }
    return [];
  }

  async crawl({create = true ,skipDb = false}={}) {
    const { feed } = this;
    this.skipDb = skipDb;
    let articles = [];
    try{
      const {resText,resHeaders,resStatus} = await this.getResponse()
      this._text=resText;
      this._headers = resHeaders;
      this._status = resStatus;
      if (resStatus >= 400 && resStatus <= 600) {
        throw new CrawlerError(`Error fetching feed ${feed.link}`,resStatus);
      }
      if (skipDb || !(await this.isCacheHit())) {
        // always the case when no request header sent
        const feedParser = new this.parserClass(this.feed,config.crawler);
        this.parser = feedParser;
        await feedParser.parse(resText);
        articles = feedParser.articles;
        this.articles = articles;
        if(feedParser.isDead){
          await this.setFeedError("Feed is probably dead",true);
          this._hasError = true;
        }
      }
    }catch(err){
      this._hasError = true;
      await this.setFeedError(err);
      throw err;
    }
    if (!skipDb && create) {
      await this.createArticles();
    }
    //await asynTimeout(10);
    if(!this._hasError){
      await this.cleanFeed();
    }
    return articles;
  }

  async cleanFeed() {
    if(this.skipDb) return;
    // Will reset the errors counters on a feed that have known errors
    const info = {};
    const now = new Date();
    const  headers = this._headers;
    info.errorCount = 0;
    info.lastError = '';
    info.lastRetrieved = now;
    info.expires = this.computeExpire();
    info.etag = (headers || {}).etag || (await this.getContentHash());
    if(this.parser){
      info.lastParserError = this.parser.lastError || "";
    }
    if (headers['last-modified']) {
      const lastModified = new Date(headers['last-modified']);
      if (!Number.isNaN(lastModified.getTime())) {
        info.lastModified = lastModified;
      }
    }
    logger.info(`Resetting errors with info ${JSON.stringify(info)}`);
    info.lastCache = await this.createCache();
    this._headers = null;
    this._text = null;
    this._status = null;
    return feedService.updateFeedById(this.feed.id, info);
  }
}

module.exports = BaseCrawler;


