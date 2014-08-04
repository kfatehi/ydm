"use strict";
var fs = require('fs')
  , _ = require('lodash')
  , Docker = require('dockerode')
  , URI = require("uri-js")

module.exports = {
  connect: function () {
    var docker = null, dockerOpts = null
      , dockerHost = process.env.DOCKER_HOST

    if (dockerHost) {
      dockerOpts = URI.parse(dockerHost)
      docker = new Docker(dockerOpts);
    } else if (fs.existsSync('/var/run/docker.sock')) {
      dockerOpts = { socketPath: '/var/run/docker.sock' };
      docker = new Docker(dockerOpts);
    } else {
      throw new Error("Failed to setup docker client");
    }
    return { docker: docker };
  }
}
