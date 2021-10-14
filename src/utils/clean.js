/**
 * Cleans a string removing all not alphanumeric characters
 * @param {string} str
 * @returns {string}
 */
const clean = (str) => {
  if(!str) return "";
  str = str.replace(/[^a-zA-Z0-9 ]/g,"")
  str = str.replace(/(^ +| +$)/g,"")
  str = str.replace(/ +/g," ")
  return str;
}

module.exports = clean;
