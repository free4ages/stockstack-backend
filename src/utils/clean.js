/**
 * Cleans a string removing all not alphanumeric characters
 * @param {string} str
 * @returns {string}
 */
const clean = (str, options = {}) => {
  if (!str) return '';
  const { stripHtml = false, lowercase = false, allow_space = true } = options;
  if (stripHtml) {
    str = str.replace(/<[^>]+>/g, ' ');
  }
  str = str.replace(/[^a-zA-Z0-9 ]/g, ' ');
  str = str.replace(/(^ +| +$)/g, '');
  str = str.replace(/ +/g, ' ');
  if (lowercase) {
    str = str.toLowerCase();
  }
  if (!allow_space) {
    str = str.replace(/ +/g, '');
  }
  return str;
};

module.exports = clean;
