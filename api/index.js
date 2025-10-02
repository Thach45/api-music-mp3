if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  try {
    // eslint-disable-next-line global-require
    const { bootstrap } = require('global-agent')
    bootstrap()
  } catch (e) {
    // ignore
  }
}

const app = require('../app')
module.exports = app


