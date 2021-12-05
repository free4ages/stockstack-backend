const BaseCrawler = require('./base');
const { gotScraping } = require('got-scraping');
const { articleService } = require('../services');
const CnbcTvParser = require('./parsers/cnbctv18.parser');
const PAGE_URL = "https://www.cnbctv18.com/api/v1/category/market?page=1&limit=5";
class CnbcTvCrawler extends BaseCrawler{
  parserClass = CnbcTvParser;
  async create(articles){
    const result = await articleService.createManyArticles(articles);
    return result;
  }
  async getResponse(skipCache){
    const reqHeaders = skipCache?{}:this.getDefaultHeaders();
    reqHeaders['referer'] = 'https://www.cnbctv18.com/market/';
    const {headers,body,statusCode}  = await gotScraping(PAGE_URL,{headers:reqHeaders})
    return {resText:body/*unescape(encodeURIComponent(body))*/,resHeaders:headers,resStatus:statusCode};
  }
}

module.exports = CnbcTvCrawler;
