/**
 * Cleans a string removing all not alphanumeric characters
 * @param {string} str
 * @returns {string}
 */
const clean = (str,options={}) => {
  if(!str) return "";
  const {stripHtml=false,lowercase=false}=options;
  if(stripHtml){
    str = str.replace(/<[^>]+>/g, '');
  }
  str = str.replace(/[^a-zA-Z0-9 ]/g," ")
  str = str.replace(/(^ +| +$)/g,"")
  str = str.replace(/ +/g," ")
  if(lowercase){
    str = str.toLowerCase();
  }
  return str;
}

module.exports = clean;
