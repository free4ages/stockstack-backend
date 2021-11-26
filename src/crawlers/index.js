const NseCrawler = require('./nse.crawler');
const ClassicCrawler = require('./classic.crawler');

const resolveCrawler = (crawlerName) => {
  let crawlerClass;
  switch (crawlerName) {
    case 'nse':
      crawlerClass = NseCrawler;
      break;
    case 'classic':
      crawlerClass = ClassicCrawler;
      break;
    default:
      crawlerClass = ClassicCrawler;
  }
  return crawlerClass;
};

module.exports = {
  NseCrawler,
  ClassicCrawler,
  resolveCrawler,
};
