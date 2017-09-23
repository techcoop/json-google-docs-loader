
// Extracts lines of code including a module with either import or require
export const getIncludes = (library, module, content) => {
  if (!library) {
    throw new TypeError('utils.getIncludes: No library')
  }

  if (!module) {
    throw new TypeError('utils.getIncludes: No module')
  }

  if (!content) {
    return {}
  }

  // Now regex out lines importing module
  // TODO benchmark with indexOf, worth doing indexOf as fast check?
  // TODO handle direct exports as well?
  // TODO combine into one regex
  let re
  let includes = {}

  // Handle variable assignments instances
  // var docs = require("test-module");
  // var docs = require('test-module');
  // var docs = require('test-module')
  // var  docs  =  require( 'test-module' );
  // var Module = require('test-module').Module;
  //
  // TODO fix trailing space
  // TODO handle let,const?
  re = new RegExp('.*var (.*).*=.*require(.*\(.*[\"|\']' + library + '[\"|\']\).*)', 'g')
  content.replace(re, (match, variable, ending) => {
    // Check if this import referencing a sub module
    let reference = ''
    if (ending.indexOf('.' + module) > -1) {
      reference = variable.trim(' ')
    } else {
      reference = variable.trim(' ') + '.' + module
    }

    // Add to dictionary of includes
    if (!includes[match]) {
      includes[match] = reference
    }
  })

  // Handle library imports
  // import library from "test-module"
  // import {Module} from "test-module";
  // import {Module, otherImport} from "test-module";
  // import {Module as SomeModule} from "test-module";
  // import {Module AS SomeModule} from "test-module";
  // TODO handle multi line imports
  re = new RegExp('.*import[ *](.*)[ *]from.*[\"|\']' + library + '[\"|\'].*', 'g')
  content.replace(re, (match, variable) => {
     // Check if our text has {} and handle individual modules
    let reference = ''
    if (variable.indexOf('{') > -1 && variable.indexOf('}') > -1) {
      let imports = variable.replace('{', '').replace('}', '').split(',')

      const aliasRe = new RegExp(' (as) ', 'i')
      // Go through all imports here and find our module
      imports.map((item) => {
        item = item.trim(' ')
        let res = item.match(aliasRe)
        // If our module contains an "as" / "AS" alias, parse that out
        if (res && res[1]) {
          let parts = item.split(res[1])
          if (parts[0].trim(' ') === module) {
            reference = parts[1].trim(' ')
          }
        } else {
          // Otherwise just check if it matches
          if (item === module) {
            reference = module
          }
        }
      });
    } else {
      // Otherwise build with variable name and module
      reference = variable.trim(' ') + '.' + module
    }

    // Add to includes
    if (!includes[match] && reference) {
      includes[match] = reference
    }
  })

  return includes
}

// Gets lines with references to replace in source
export const getObjects = (includes, content) => {
  if (!includes) {
    return {}
  }

  if (!content) {
    return {}
  }

  let objects = {}

  // Go through all includes and extract objects
  // TODO remove training space in regex
  Object.keys(includes).map((item) => {
    const re = new RegExp('.*[var|let|const][ *](.*)=.*new[ *]' + includes[item] + '\(.*[\"|\'](.*)[\"|\']\).*', 'g')
    content.replace(re, (match, variable, type, url) => {
      // Add to objects
      if (!objects[match] && url) {
        objects[match] = {variable: variable.trim(), url: url}
      }
    })
  })

  return objects
}

// Resolves URLs for all objects
// TODO refactor for parallel resolving
export const resolveObjects = (objects, Document, callback) => {
  const items = Object.keys(objects)
  let count = 0

  // Loop through objects, create document, and resolve data
  items.map((item) => {
    const instance = new Document(objects[item]['url'])
    instance.fetch().then(() => {
      objects[item].data = instance.data
      count++
      if (count >= items.length) {
        callback(objects)
      }
    })
  })
}

// Converts an existing source into a transpiled one
export const transpile = (source, objects) => {
  Object.keys(objects).map((item) => {
    let inject = item + '\n' + objects[item].variable + '.data = ' + JSON.stringify(objects[item].data) + ';'
    // TODO refactor to use regex instead?
    source = source.split(item).join(inject)
  })

  return source
}
