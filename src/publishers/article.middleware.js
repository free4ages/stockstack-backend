const log = async (req,push) => {
  console.log(`Logging PUSH:`, req);
}

const create = async (req,push) => {
  console.log(`Push Middleware: ${JSON.stringify(req)}`);
  push(req);
}

module.exports = {
  create,
  log,
}
