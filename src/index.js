import transform from './transform'
import compile from './swc'

transform.compiler = compile

self.esmsTransform = transform

self.esmsInitOptions = Object.assign(
  {
    shimMode: true,
    noLoadEventRetriggers: true,
    revokeBlobURLs: true,
    fetch: transform
  },
  self.esmsInitOptions
)
