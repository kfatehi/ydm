"use strict";
var fs = require('fs')
  , _ = require('lodash')
  , Docker = require('dockerode')
  , opt = require('dockerode-optionator')

module.exports = {
  connect: function (cb) {
    var dOpts = opt.normalizeOptions({}, process.env);
    var docker = new Docker(dOpts);
    docker.listContainers(function (err) {
      if (err) {
        console.error("Failed to connect with options "+JSON.stringify(dOpts))
        throw new Error(err)
      } else {
        cb(null, { docker: docker });
      }
    })
  }
}
