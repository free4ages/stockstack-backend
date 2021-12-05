/* eslint class-methods-use-this: 0 */
const BaseParser = require('./base');
const cheerio = require('cheerio')
const MoneyControlBuilder = require('../builders/moneycontrol.builder');

class MoneyControlParser extends BaseParser{
  builderClass = MoneyControlBuilder;
  
  addDefaultFields(article){
    article.feed = this.feed.id || (this.feed._id || "").toString();
    article.sources=['feed'];
    article.pageLink= this.feed.link;
    article.retrieveDate = new Date();
  }
  async parseText(text){
    const $ = cheerio.load(text);
    const items = [];
    const itemels = $('li','#cagetory');
    let data,$el;
    itemels.each((i,el)=>{
      $el = $(el);
      data = {};
      data.title = $el.find('> h2 > a').text();
      data.desc = $el.find('> p:first').text();
      data.link = $el.find('> h2 > a').attr('href');
      data.pubDateRaw = $el.find('span:first').text();
      if(data.title && data.link){
        items.push(data);
      }
    })
    return items;
  }
}
module.exports = MoneyControlParser;


