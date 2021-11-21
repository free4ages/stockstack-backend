/* eslint class-methods-use-this: 0 */
const truncate = require('../../utils/truncate');
const BaseBuilder = require('./base');

class NseBuilder extends BaseBuilder {
  extractTitle(entry) {
    return entry.attchmntText || "";
  }

  extractDisplayTitle(entry){
    const title = this.extractTitle(entry);
    if(title.length>120){
      return truncate(title,120);
    }
    return '';
  }

  extractShortText(entry) {
    const title = this.extractTitle(entry);
    if(title.length>120){
      return title;
    }
    return "";
  }

  extractPubDateRaw(entry) {
    return entry.exchdisstime || entry.an_dt || entry.sort_date || "";
  }

  extractPubDate(entry) {
    const dateText = entry.exchdisstime || entry.an_dt || entry.sort_date || "";
    if (dateText) {
      try {
        const date = new Date(dateText);
        if (Number.isNaN(date.getTime())) {
          return null;
        }
        return date;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  extractLink(entry) {
    return "";
  }

  extractTopics(entry) {
    const topics = [];
    if(entry.desc){
      topics.push(entry.desc);
    }
    if(entry.smIndustry){
      topics.push(entry.smIndustry);
    }
    return topics;
  }
  extractTags(entry){
    const tags = [];
    if(entry.symbol){
      tags.push(entry.symbol);
    }
    return tags;
  }
  extractAttachmentLink(entry){
    return entry.attchmntFile? entry.attchmntFile:"";
  }
}
module.exports = NseBuilder;
