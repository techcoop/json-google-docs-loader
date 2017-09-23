import { getIncludes, getObjects, transpile, resolveObjects } from './../src/utils'
import MockDocument from './../__mocks__/mockDocument'

describe('When using getIncludes', function() {
  it('it should throw a TypeError when library is not passed', function() {
    expect(() => {
      getIncludes()
    }).toThrow(TypeError)
  })

  it('it should throw a TypeError when module is not passed', function() {
    expect(() => {
      getIncludes('test-library')
    }).toThrow(TypeError)
  })

  it('it should return an empty object when content is empty', function() {
    expect(getIncludes('test-library', 'Module', '')).toEqual({})
  })

  it('it should return an empty object when no usages exist', function() {
    expect(getIncludes('test-library', 'Module', 'var other = require("other");')).toEqual({})
  })

  it('it should return an empty object and avoid incorrect appearances of library', function() {
    let lines = [];
    lines.push('import library from "test-module-example";');
    lines.push('var docs = require("test-module-example");');
    lines.push('var item = "test-module";');
    lines.push('var obj = {test: "test-module"};');

    expect(getIncludes('test-module', 'Module', lines.join('\n'))).toEqual({})
  })

  it('it should return lines with require', function() {
    const code = 'var docs = require("test-module");';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'var docs = require("test-module");': 'docs.Module'})
  })

  it('it should return lines with require that include a module', function() {
    const code = 'var Module = require("test-module").Module;';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'var Module = require("test-module").Module;': 'Module'})
  })

  it('it should return more than one result with require', function() {
    let lines = []
    lines.push('var Module = require("test-module").Module;')
    lines.push('var docs = require("test-module");')

    const includes = getIncludes('test-module', 'Module', lines.join('\n'))
    expect(includes['var Module = require("test-module").Module;']).toEqual('Module')
    expect(includes['var docs = require("test-module");']).toEqual('docs.Module')
  })

  it('it should return lines with require with single quotes and weird spacing', function() {
    const code = 'var  docs  =  require(  \'test-module\'  );';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'var  docs  =  require(  \'test-module\'  );': 'docs.Module'})
  })

  it('it should return lines with importing whole library', function() {
    const code = 'import library from "test-module"';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'import library from "test-module"': 'library.Module'})
  })

  it('it should return lines with import module', function() {
    const code = 'import {Module} from "test-module";';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'import {Module} from "test-module";': 'Module'})
  })

  it('it should return more than one result with import', function() {
    let lines = []
    lines.push('import {Module} from "test-module";')
    lines.push('import module from "test-module";')

    const includes = getIncludes('test-module', 'Module', lines.join('\n'))
    expect(includes['import {Module} from "test-module";']).toEqual('Module')
    expect(includes['import module from "test-module";']).toEqual('module.Module')
  })

  it('it should return lines with import module with single quotes and weird spacing', function() {
    const code = 'import  {  Module  }  from \'test-module\'';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'import  {  Module  }  from \'test-module\'': 'Module'})
  })

  it('it should return lines with import module when more than one specified', function() {
    const code = 'import {Module, otherImport} from "test-module";';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'import {Module, otherImport} from "test-module";': 'Module'})
  })

  it('it should return lines with import Module as with proper aliased name in lower case', function() {
    const code = 'import {Module as SomeModule} from "test-module";';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'import {Module as SomeModule} from "test-module";': 'SomeModule'})
  })

  it('it should return lines with import Module as with proper aliased name in upper case', function() {
    const code = 'import {Module AS SomeModule} from "test-module";';
    expect(getIncludes('test-module', 'Module', code)).toEqual({'import {Module AS SomeModule} from "test-module";': 'SomeModule'})
  })

  it('it should return an empty object when there is an import but Module is not present', function() {
    const code = 'import {Something, otherImport} from "test-module";';
    expect(getIncludes('test-module', 'Module', code)).toEqual({})
  })
})

describe('When using getObjects', function() {
  it('it should return an empty object when passed no includes or content', function() {
    expect(getObjects()).toEqual({})
    expect(getObjects({})).toEqual({})
  })

  it('it should return an empty object and avoids incorrect references of module ', function() {
    const includes = {'import {Module} from "test-module";': 'Module'}
    let lines = [];
    lines.push('var item = new OtherModule("http://localhost");');
    lines.push('var item = "Module";');

    expect(getObjects(includes, lines.join('\n'))).toEqual({})
  })

  it('it should return lines of code when using var with url and variable reference', function() {
    const includes = {'import {Module} from "test-module";': 'Module'}
    const code = 'var item = new Module("http://localhost");';

    const objects = getObjects(includes, code)
    expect(objects['var item = new Module("http://localhost");']).toEqual({url: 'http://localhost', variable: 'item'})
  })

  it('it should return lines of code when using let', function() {
    const includes = {'import {Module} from "test-module";': 'Module'}
    const code = 'let item = new Module("http://localhost");';

    const objects = getObjects(includes, code)
    expect(objects['let item = new Module("http://localhost");']).toEqual({url: 'http://localhost', variable: 'item'})
  })

  it('it should return lines of code when using const', function() {
    const includes = {'import {Module} from "test-module";': 'Module'}
    const code = 'const item = new Module("http://localhost");';

    const objects = getObjects(includes, code)
    expect(objects['const item = new Module("http://localhost");']).toEqual({url: 'http://localhost', variable: 'item'})
  })

  it('it should return multiple lines of code with different URLs', function() {
    const includes = {'import {Module} from "test-module";': 'Module'}
    let lines = [];
    lines.push('const item1 = new Module("http://localhost1");');
    lines.push('const item2 = new Module("http://localhost2");');

    const objects = getObjects(includes,  lines.join('\n'))

    expect(objects['const item1 = new Module("http://localhost1");']).toEqual({url: 'http://localhost1', variable: 'item1'})
    expect(objects['const item2 = new Module("http://localhost2");']).toEqual({url: 'http://localhost2', variable: 'item2'})
  })
})

describe('When using resolveObjects', function() {
  it('it should return data for every object', function(done) {
    const objects = {
      'const item1 = new Module("http://localhost1");': {url: 'http://localhost1', variable: 'item1'},
      'const item2 = new Module("http://localhost2");': {url: 'http://localhost2', variable: 'item2'}
    }

    resolveObjects(objects, MockDocument, (resolved) => {
      expect(resolved['const item1 = new Module("http://localhost1");'].data).toEqual({url: 'http://localhost1'})
      expect(resolved['const item2 = new Module("http://localhost2");'].data).toEqual({url: 'http://localhost2'})
      done()
    })
  })
})

describe('When using transpile', function() {
  it('it should inject code for objects', function() {
    const objects = {
      'const item1 = new Module("http://localhost1");': {
        url: 'http://localhost1',
        variable: 'item1',
        data: {Test1: 'Value1'}
      },
      'const item2 = new Module("http://localhost2");': {
        url: 'http://localhost2',
        variable: 'item2',
        data: {Test2: 'Value2'}
      }
    }

    let lines = [];
    lines.push('const item1 = new Module("http://localhost1");');
    lines.push('const item1 = new Module("http://localhost1");');
    lines.push('const item2 = new Module("http://localhost2");');
    lines.push('const item2 = new Module("http://localhost2");');

    const result = transpile(lines.join('\n'), objects)

    let compare = []
    compare.push('const item1 = new Module("http://localhost1");');
    compare.push('item1.data = {"Test1":"Value1"};');
    compare.push('const item1 = new Module("http://localhost1");');
    compare.push('item1.data = {"Test1":"Value1"};');

    compare.push('const item2 = new Module("http://localhost2");');
    compare.push('item2.data = {"Test2":"Value2"};');
    compare.push('const item2 = new Module("http://localhost2");');
    compare.push('item2.data = {"Test2":"Value2"};');

    expect(result).toEqual(compare.join('\n'))
  })
})