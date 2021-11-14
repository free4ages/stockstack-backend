const clean = require('./clean');

const createRegex = (words) => {
  const regs = words.map((word) => {
    return `\\b${word.replace(/ +/g, ' *')}\\b`;
  });
  return new RegExp(regs.join('|'));
};

const hasWord = (content, tags) => {
  if (!tags) return false;
  const cleanContent = clean(content).toLowerCase();
  const cleanTags = tags.map((tag) => clean(tag).toLowerCase());
  const regex = createRegex(cleanTags);
  return !!regex.test(cleanContent);
};

module.exports = {
  hasWord,
  createRegex,
};
