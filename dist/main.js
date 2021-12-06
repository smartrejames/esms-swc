(function () {
  'use strict';

  let jsContentType = /^(?:text|application)\/javascript(?:;|$)/;
  let compiler;

  function createBlob(source, type = 'text/javascript') {
    return URL.createObjectURL(new Blob([source], { type }))
  }

  let dynamicImport = (function () {
    try {
      return (0, eval)('u=>import(u)')
    } catch (e) {}

    let err;
    window.addEventListener('error', _err => (err = _err));
    dynamicImport = url => {
      err = undefined;
      const src = createBlob(`import*as m from'${url}';self._esmsi=m;`);
      const s = Object.assign(document.createElement('script'), {
        type: 'module',
        src
      });
      s.setAttribute('noshim', '');
      document.head.appendChild(s);
      return new Promise((resolve, reject) => {
        s.addEventListener('load', () => {
          document.head.removeChild(s);
          if (self._esmsi) {
            resolve(self._esmsi);
            self._esmsi = null;
          } else {
            reject(
              err.error ||
                new Error(`Error loading or executing the graph of ${url}.`)
            );
            err = undefined;
          }
        });
      })
    };
  })();

  function toSourceMappingURL(map) {
    return `\n//# sourceMappingURL=data:application/json;base64,${btoa(map)}`
  }

  function transform(url, options) {
    return self.fetch(url, options).then(response => {
      let contentType = response.headers.get('content-type');
      if (
        !response.ok ||
        !response.url.startsWith(location.origin) ||
        !jsContentType.test(contentType)
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
            map = toSourceMappingURL(map);
          }
          let newResponse = new Response(
            new Blob([code, map], { type: 'application/javascript' })
          );
          Object.defineProperty(newResponse, 'url', { value: response.url });
          return newResponse
        })
    })
  }

  Object.defineProperty(transform, 'compiler', {
    get() {
      return compiler
    },
    set(c) {
      compiler = c;
    }
  });

  let swcConfig = {
    jsc: {
      parser: {
        syntax: 'ecmascript'
      },
      target: 'es2018'
    },
    sourceMaps: true,
    inlineSourcesContent: true
  };

  let swcPromise;

  let swcCDNUrl = 'https://unpkg.com/@swc/wasm-web@1/wasm.js';

  let tsRegex = /\/[a-zA-Z0-9_.@-]+\.tsx?(?:[?#]|$)/;

  function initSwc() {
    return dynamicImport(swcCDNUrl).then(mod => mod.default().then(() => mod))
  }

  function compile({ content: script, url }) {
    if (!swcPromise) {
      swcPromise = initSwc();
    }

    return swcPromise.then(swc => {
      if (tsRegex.test(url)) {
        swcConfig.jsc.parser.syntax = 'typescript';
      } else {
        swcConfig.jsc.parser.syntax = 'ecmascript';
      }
      let result = swc.transformSync(script, swcConfig);
      result.map = result.map.replace('["<anon>"]', `["${url}"]`);
      return result
    })
  }

  transform.compiler = compile;

  self.esmsTransform = transform;

  self.esmsInitOptions = Object.assign(
    {
      shimMode: true,
      noLoadEventRetriggers: true,
      revokeBlobURLs: true,
      fetch: transform
    },
    self.esmsInitOptions
  );

})();
