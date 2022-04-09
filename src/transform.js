let jsContentType = /^(?:text|application)\/javascript(?:;|$)/
let jsExtension = /\.(?:tsx?|jsx?)(?:[?#]|$)/
let compiler

function toSourceMappingURL(map) {
  return `\n//# sourceMappingURL=data:application/json;base64,${btoa(map)}`
}

function transform(url, options) {
  return self.fetch(url, options).then(response => {
    let contentType = response.headers.get('content-type')
    if (
      !response.ok ||
      !response.url.startsWith(location.origin) ||
      !(jsContentType.test(contentType) || jsExtension.test(response.url))
    ) {
      return response
    }

    return response
      .text()
      .then(script =>
        compiler({ content: script, type: contentType, url: response.url })
      )
      .then(({ code, map }) => {
        if (map) {
          map = toSourceMappingURL(map)
        }
        let newResponse = new Response(
          new Blob([code, map], { type: 'application/javascript' })
        )
        Object.defineProperty(newResponse, 'url', { value: response.url })
        return newResponse
      })
  })
}

Object.defineProperty(transform, 'compiler', {
  get() {
    return compiler
  },
  set(c) {
    compiler = c
  }
})

export default transform
