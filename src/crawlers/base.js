const logger = require('../config/logger');
const RssParser = require('rss-parser');
const config = require('../config/config');
const {fetchWithTimeout,fetch} = require('../utils/fetchWithTimeout');
const feedService = require('../services/feed.service');
const ClassicBuilder = require('./builders/classic.builder');
class BaseCrawler{
  constructor(feed){
    this.feed = feed;
    this.response = null;
    this.feedError = null;
    this.articles=[]; //holds builder instances
  }
  getHeaders(modifiedHeaders=true){
    const feed = this.feed;
    const headers = {
      'User-Agent': config.crawler.userAgent,
    };
    if(modifiedHeaders){
      if(feed.lastModified) headers['If-Modified-Since'] = feed.lastModified.toGMTString();
      if(feed.etag) headers['If-None-Match']= feed.etag;
      if(headers['If-Modified-Since'] || headers['If-None-Match']){
        headers['A-IM']='feed';
      }
    }
    return headers;
  }
  computeExpire(){
    const feed = this.feed;
    const now = new Date();
    return new Date(now.getTime()+feed.crawlIntervalInSec*1000);
  }
  isCacheHit(response){
    if(
      response.status == 304 ||
      response.status == 226 ||
      response.headers.get('etag') === this.feed.etag
    ){
      logger.info("Cache hit found");
      return true;
    }
    return false
  }
  async setFeedError(error){
    const feed = this.feed;
    const info ={
      lastError: `${error}`,
      errorCount: feed.errorCount+1,
      lastRetrieved: new Date(),
      expires:this.computeExpire()
    };
    logger.error(error)
    return await feedService.updateFeedById(feed.id,info);
    
  }
  async parseFeedResponse(response){
    const text = await response.text();
    const rssParser = new RssParser();
    const parsed = await rssParser.parseString(text);
    return parsed;
  }
  async buildArticles(response){
    const feed = this.feed;
    const parsed = await this.parseFeedResponse(response);
    if(!parsed) return [];
    this.articles = parsed.items.map((entry)=>{
      return ClassicBuilder(this.feed,entry)
    },this);
    return this.articles;
  }
  async createMissingArticles(response){
    const feed = this.feed;
    logger.info(`${feed.title} cache validation failed, challenging entries`)
    const parsed = await this.parseFeedResponse(response);
    if(!parsed) return;

    parsed.items.forEach((item)=>{
      console.log(item.title + ':' + item.link);
    });
  }
  async crawl(force=false){
    const feed = this.feed;
    let response;
    try{
      response = await this.request(!force)
      this.response = response;
      if(response.status >=400 && response.status<=600){
        throw new CrawlerError(`Error fetching feed ${feed.link}`,response.status);
      }
    }catch(err){
      //await this.setFeedError(err);
      this.feedError = err;
      throw err;
    }
    let articles =[];
    if(!this.isCacheHit(response)){ //always the case when no request header sent
      articles = await this.buildArticles(response);
    }
    return articles;
  }
  async request(){
    return await fetchWithTimeout(this.feed.link,{headers:this.getHeaders(),timeout:config.crawler.timeout})
    //return await fetch(this.feed.link,{headers:this.getHeaders()})
  }
}

module.exports = BaseCrawler;
