const defaultOptions = {
  cdn: '//unpkg.com',
  swcVersion: '1',
  esmsVersion: '1'
}

let optionsScript = document.querySelector('script[type=ess-options]')
/**
 * @type {{
 * cdn: string,
 * swcVersion: string
 * }}
 */
const option = Object.assign(
  {},
  defaultOptions,
  optionsScript && JSON.parse(optionsScript.innerHTML)
)

export { option }

function createBlob(source, type = 'text/javascript') {
  return URL.createObjectURL(new Blob([source], { type }))
}

let dynamicImport = (function () {
  try {
    return (0, eval)('u=>import(u)')
  } catch (e) {}

  let err
  window.addEventListener('error', _err => (err = _err))
  dynamicImport = url => {
    err = undefined
    const src = createBlob(`import*as m from'${url}';self._esmsi=m;`)
    const s = Object.assign(document.createElement('script'), {
      type: 'module',
      src
    })
    s.setAttribute('noshim', '')
    document.head.appendChild(s)
    return new Promise((resolve, reject) => {
      s.addEventListener('load', () => {
        document.head.removeChild(s)
        if (self._esmsi) {
          resolve(self._esmsi)
          self._esmsi = null
        } else {
          reject(
            err.error ||
              new Error(`Error loading or executing the graph of ${url}.`)
          )
          err = undefined
        }
      })
    })
  }
})()

export { dynamicImport }
