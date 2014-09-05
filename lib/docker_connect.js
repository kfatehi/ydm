"use strict";
var Docker = require('dockerode')
  , normalizer = require('dockerode-optionator')
  , options = normalizer.normalizeOptions({}, process.env);

module.exports = {
  options: options,
  connect: function () {
    return { docker: new Docker(options) };
  }
}

