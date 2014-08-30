var dropMaker = require('../lib/drop_maker')
var fs = require('fs')
var _ = require('lodash')
var path = require('path')

function drops(d) {
  var _ = require('lodash')
  return _.zipObject(d, _.map(d, function (name) {
    return function (argv, ydm) {
      return dropMaker.buildDrop(name, argv, ydm)
    }
  }))
}

module.exports = function(dropsPath) {
  return drops(_.map(_.without(fs.readdirSync(dropsPath), 'index.js'), function(fname) {
    return fname.replace(path.extname(fname), '')
  }))
}
