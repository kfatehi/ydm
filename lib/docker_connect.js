"use strict";
var fs = require('fs')
  , _ = require('lodash')
  , Docker = require('dockerode')
  , opt = require('dockerode-optionator')

module.exports = {
  connect: function () {
    var dOpts = opt.normalizeOptions({}, process.env);
    var docker = new Docker(dOpts);
    return { docker: docker };
  }
}
