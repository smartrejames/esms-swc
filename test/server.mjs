import { createServer } from 'http'
import serverHandler from 'serve-handler'
import { readFile } from 'fs/promises'
import { once } from 'events'
import open from 'open'

const port = 3000

let shouldExit = true
let failTimeout, browserTimeout

function setBrowserTimeout() {
  if (!shouldExit) return
  if (browserTimeout) clearTimeout(browserTimeout)
  browserTimeout = setTimeout(() => {
    console.log('No browser requests made to server for 10s, closing.')
    process.exit(failTimeout ? 1 : 0)
  }, 10000)
}

const serveConf = readFile('./serve.json', 'utf8')
  .then(text => JSON.parse(text))
  .catch(() => {})

const server = createServer(async (request, response) => {
  setBrowserTimeout()
  if (request.url === '/done') {
    console.log('Tests completed successfully.')
    if (shouldExit) {
      process.exit()
    }
    return
  }
  if (request.url === '/error') {
    console.log('method', request.method)
    if (request.method === 'POST') {
      let body = ''
      request.on('data', c => (body += c))

      await once(request, 'end')
      console.log('Test failures:', body)
    } else {
      console.log('Test failures found.')
    }

    if (shouldExit) {
      failTimeout = setTimeout(() => process.exit(1), 10000)
    }
    return
  }
  if (request.url === '/ping') {
    response.writeHead(204).end()
    return
  }

  if (failTimeout) {
    clearTimeout(failTimeout)
    failTimeout = null
  }
  const config = await serveConf

  return serverHandler(request, response, config)
})

server.listen(port)

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, quiting...')
    setTimeout(() => {
      server.close()
      process.exit(2)
    }, 200)
  }
})

server.on('listening', () => {
  console.log(`Test server listening on http://localhost:${port}\n`)
  open(`http://localhost:${port}/test/test.html`)
})
