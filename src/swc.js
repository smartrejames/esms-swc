import { option, dynamicImport } from './common'

let swcConfig = {
  jsc: {
    parser: {
      syntax: 'ecmascript'
    },
    target: 'es2018'
  },
  sourceMaps: true,
  inlineSourcesContent: true
}

let swcCDNUrl = `${option.cdn}/@swc/wasm-web@${option.swcVersion}/wasm.js`

let tsRegex = /\/[a-zA-Z0-9_.@-]+\.tsx?(?:[?#]|$)/

let swcPromise

function initSwc() {
  return dynamicImport(swcCDNUrl).then(mod => mod.default().then(() => mod))
}

function compile({ content: script, url }) {
  if (!swcPromise) {
    swcPromise = initSwc()
  }

  return swcPromise.then(swc => {
    if (tsRegex.test(url)) {
      swcConfig.jsc.parser.syntax = 'typescript'
    } else {
      swcConfig.jsc.parser.syntax = 'ecmascript'
    }
    let result = swc.transformSync(script, swcConfig)
    result.map = result.map.replace('["<anon>"]', `["${url}"]`)
    return result
  })
}

export default compile
