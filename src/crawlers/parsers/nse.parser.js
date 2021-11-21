/* eslint class-methods-use-this: 0 */

const BaseParser = require('./base');
const NseBuilder = require('../builders/nse.builder');

class NseParser extends BaseParser{
  builderClass = NseBuilder;
  
  addDefaultFields(article){
    article.feed = this.feed.id || (this.feed._id || "").toString();
    article.sources=['feed'];
    article.pageLink= this.feed.link;
    article.retrieveDate = new Date();
  }
  async parseText(text){
    const objs = JSON.parse(text);
    return objs;
  }
}
module.exports = NseParser;
