import { default as loader } from './../src/index'
import { createMockXHR } from './../__mocks__/mockXhr'

describe('When using the loader in webpack ', function() {
  it('it should be exported as a function', function() {
    expect(typeof loader).toEqual('function')
  })

  it('it should transpile an import statement', function(done) {
    // Construct document
    let lines = []
    lines.push('import { Document } from "json-google-docs";')
    lines.push('var item = new Document("http://localhost");')

    // Keep reference to request
    const oldXMLHttpRequest = window.XMLHttpRequest
    const data = {data: {field: 'value'}}
    let mockXHR = createMockXHR(data)
    window.XMLHttpRequest = jest.fn(() => mockXHR)

    // TODO refactor async mocking
    const async = (source, inputSourceMap) => {
      // Compare to
      let compare = []
      compare.push('import { Document } from "json-google-docs";')
      compare.push('var item = new Document("http://localhost");')
      compare.push('item.data = {"field":"value"};')

      expect(source).toEqual(compare.join('\n'))
      done()
    }

    loader(lines.join('\n'), {}, async)

    // Trigger onload
    mockXHR.onload()

    // Restore reference to request
    window.XMLHttpRequest = oldXMLHttpRequest
  })

  it('it should transpile a require statement', function(done) {
    // Construct document
    let lines = []
    lines.push('var Document = require("json-google-docs").Document;')
    lines.push('var item = new Document("http://localhost");')

    // Keep reference to request
    const oldXMLHttpRequest = window.XMLHttpRequest
    const data = {data: {field: 'value'}}
    let mockXHR = createMockXHR(data)
    window.XMLHttpRequest = jest.fn(() => mockXHR)

    // TODO refactor async mocking
    const async = (source, inputSourceMap) => {
      // Compare to
      let compare = []
      compare.push('var Document = require("json-google-docs").Document;')
      compare.push('var item = new Document("http://localhost");')
      compare.push('item.data = {"field":"value"};')

      expect(source).toEqual(compare.join('\n'))
      done()
    }

    loader(lines.join('\n'), {}, async)

    // Trigger onload
    mockXHR.onload()

    // Restore reference to request
    window.XMLHttpRequest = oldXMLHttpRequest
  })
})
