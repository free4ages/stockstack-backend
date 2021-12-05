/* eslint class-methods-use-this: 0 */
const BaseParser = require('./base');
const cheerio = require('cheerio')
const CnbcTvBuilder = require('../builders/cnbctv18.builder');

class CnbcTvParser extends BaseParser{
  builderClass = CnbcTvBuilder;
  
  addDefaultFields(article){
    article.feed = this.feed.id || (this.feed._id || "").toString();
    article.sources=['feed'];
    article.pageLink= this.feed.link;
    article.retrieveDate = new Date();
  }
  async parseText(text){
    const result=JSON.parse(text).result;
    return result;
  }
}
module.exports = CnbcTvParser;

