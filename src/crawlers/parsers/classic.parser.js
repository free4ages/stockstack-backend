/* eslint class-methods-use-this: 0 */

const BaseParser = require('./base');
const RssParser = require('rss-parser');
const ClassicBuilder = require('../builders/classic.builder');

class ClassicParser extends BaseParser{
  builderClass = ClassicBuilder;
  
  addDefaultFields(article){
    article.feed = this.feed.id || (this.feed._id || "").toString();
    article.sources=['feed'];
    article.pageLink= this.feed.link;
    article.retrieveDate = new Date();
  }
  async parseText(text){
    const rssParser = new RssParser();
    const parsed = await rssParser.parseString(text);
    return parsed.items;
  }
}
module.exports = ClassicParser;

