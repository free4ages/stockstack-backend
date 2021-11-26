const log = async () => {};

const create = async (req, push) => {
  push(req);
};

module.exports = {
  create,
  log,
};
