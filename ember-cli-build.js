'use strict'

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon')

module.exports = function (defaults) {
  const app = new EmberAddon(defaults, {
    babel: {
      optional: ['es7.decorators']
    },
    'ember-cli-babel': {
      includePolyfill: true
    },
    sassOptions: {
      includePaths: [
        'addon/styles'
      ]
    },
    snippetPaths: [
      'code-snippets'
    ],
    snippetSearchPaths: [
      'tests/dummy'
    ]
  })

  app.import('bower_components/highlightjs/styles/github.css')
  app.import(app.project.addonPackages['ember-source']
    ? 'vendor/ember/ember-template-compiler.js' : 'bower_components/ember/ember-template-compiler.js')

  return app.toTree()
}
