import transform from './transform'
import compile from './swc'
import { option } from './common'

transform.compiler = compile

self.esmsInitOptions = {
  shimMode: true,
  noLoadEventRetriggers: true,
  revokeBlobURLs: true,
  fetch: transform
}

async function loadEsModuleShim() {
  let esmsUrl = `${option.cdn}/es-module-shims@${option.swcVersion}/dist/es-module-shims.wasm.js`
  let response = await fetch(esmsUrl)
  if (response.status !== 200) {
    throw new Error(`Load es-module-shim error: ${response.statusText}`)
  }
  let text = await response.text()
  let script = `${text}\n//# sourceURL=${esmsUrl}`
  ;(0, eval)(script)
}

loadEsModuleShim()
