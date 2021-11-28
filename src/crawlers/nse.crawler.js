const BaseCrawler = require('./base');
const { gotScraping } = require('got-scraping');
const tough = require('tough-cookie');
const { articleService } = require('../services');
const NseParser = require('./parsers/nse.parser');


const PAGE_URL = "https://www.nseindia.com/companies-listing/corporate-filings-announcements";
const API_URL = "https://www.nseindia.com/api/corporate-announcements?index=equities";

class NseCrawler extends BaseCrawler{
  parserClass = NseParser;

  async create(articles){
    const result = await articleService.createManyArticles(articles,{uniqCheck:['title'],doSearchTag:false,dupCheckDays:2});
    return result;
  }
  async getResponse(skipCache){
    const cookieJar = new tough.CookieJar();
    const sessionToken = {tmp:1}
    const mainRes = await gotScraping(PAGE_URL,{cookieJar,sessionToken})
    const cookie = cookieJar.getCookieStringSync(PAGE_URL);
    const reqHeaders = {cookie};
    reqHeaders.referer='https://www.nseindia.com/companies-listing/corporate-filings-announcements';
    const {headers,body,statusCode} = await gotScraping(API_URL,{sessionToken,headers:reqHeaders});
    return {resText:body,resHeaders:headers,resStatus:statusCode};
  }
}

module.exports = NseCrawler;

