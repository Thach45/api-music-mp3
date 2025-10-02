// Use a custom proxy env so npm/yarn during build are not affected
const outboundProxy = process.env.OUTBOUND_HTTP_PROXY || process.env.OUTBOUND_HTTPS_PROXY
if (outboundProxy) {
  try {
    const proxyUrl = outboundProxy
    if (!process.env.GLOBAL_AGENT_HTTP_PROXY) {
      process.env.GLOBAL_AGENT_HTTP_PROXY = proxyUrl
    }
    const { bootstrap } = require('global-agent')
    bootstrap()
  } catch (e) {
    // ignore
  }
}

const app = require('../app')
module.exports = app


