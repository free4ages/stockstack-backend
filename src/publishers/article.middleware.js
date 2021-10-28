const log = async (req) => {};

const create = async (req, push) => {
  push(req);
};

module.exports = {
  create,
  log,
};
