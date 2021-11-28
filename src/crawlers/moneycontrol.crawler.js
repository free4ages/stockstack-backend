const BaseCrawler = require('./base');
const { gotScraping } = require('got-scraping');
const { articleService } = require('../services');
const MoneyControlParser = require('./parsers/moneycontrol.parser');

class MoneyControlCrawler extends BaseCrawler{
  parserClass = MoneyControlParser;
  async create(articles){
    const result = await articleService.createManyArticles(articles);
    return result;
  }
  async getResponse(skipCache){
    const reqHeaders = skipCache?{}:this.getDefaultHeaders();
    reqHeaders['referer'] = 'https://www.moneycontrol.com/news/business/';
    const {headers,body,statusCode}  = await gotScraping(this.feed.link,{headers:reqHeaders})
    return {resText:unescape(encodeURIComponent(body)),resHeaders:headers,resStatus:statusCode};
  }
}

module.exports = MoneyControlCrawler;

