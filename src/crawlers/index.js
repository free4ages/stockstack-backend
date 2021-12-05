const NseCrawler = require('./nse.crawler');
const ClassicCrawler = require('./classic.crawler');
const MoneyControlCrawler = require('./moneycontrol.crawler');
const CnbcTvCrawler = require('./cnbctv18.crawler');

const resolveCrawler = (crawlerName) => {
  let crawlerClass;
  switch (crawlerName) {
    case 'nse':
      crawlerClass = NseCrawler;
      break;
    case 'classic':
      crawlerClass = ClassicCrawler;
      break;
    case 'moneycontrol':
      crawlerClass = MoneyControlCrawler;
      break;
    case 'cnbctv':
      crawlerClass = CnbcTvCrawler;
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
