const truncate = (text,maxlen=150) => {
  return text.length > maxlen? text.substring(0,maxlen-3)+"...":text;
}

module.exports = truncate;
