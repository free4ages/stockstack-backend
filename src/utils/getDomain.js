const urlParser = require('url');
const { parseDomain } = require('parse-domain');

const getDomain = (link) => {
  if (!link) return '';
  try {
    return parseDomain(urlParser.parse(link).hostname).domain;
  } catch (e) {
    return '';
  }
};
module.exports = getDomain;
