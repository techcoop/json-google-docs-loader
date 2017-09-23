import { Document } from 'json-google-docs'
import { getIncludes, getObjects, transpile, resolveObjects } from './../src/utils'
import { config } from '../config'

// TODO fix issues mocking this async loader
const loader = (source, inputSourceMap, callback) => {
  const includes = getIncludes(config.library, config.module, source)
  const objects = getObjects(includes, source)

  if (this && this.async) {
    callback = this.async()
  }

  resolveObjects(objects, Document, (resolved) => {
    callback(transpile(source, resolved), inputSourceMap)
  })
}

export default loader
