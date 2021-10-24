const log = async (payload,req) => {
  console.log(`Logging PULL:`, payload);
}

const create = async (payload,req) => {
  console.log(`createArticle called with payload`, payload);
  console.log(`createArticle called with req`, req);
}

module.exports = {
  create,
  log,
}
