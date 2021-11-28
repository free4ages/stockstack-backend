const BaseCrawler = require('./base');
const { gotScraping } = require('got-scraping');
const RssParser = require('rss-parser');
const { feedService, articleService } = require('../services');
const ClassicParser = require('./parsers/classic.parser');

class ClassicCrawler extends BaseCrawler{
  parserClass = ClassicParser;
  async create(articles){
    const result = await articleService.createManyArticles(articles);
    return result;
  }
  async getResponse(skipCache){
    const reqHeaders = skipCache?{}:this.getDefaultHeaders();
    const {headers,body,statusCode}  = await gotScraping(this.feed.link,{headers:reqHeaders})
    return {resText:body,resHeaders:headers,resStatus:statusCode};
  }
}

module.exports = ClassicCrawler;
