const fetch = require('node-fetch');
const AbortController = require('abort-controller');

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 30 } = options;
  delete options.timeout;
  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort();
  }, timeout * 1000);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

module.exports = {
  fetchWithTimeout,
  fetch,
};
