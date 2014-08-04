"use strict";
var fs = require('fs')
  , _ = require('lodash')
  , Docker = require('dockerode')
  , URI = require("uri-js")

module.exports = {
  connect: function () {
    var docker = null, local = null, dockerOpts = null
      , dockerHost = process.env.DOCKER_HOST
    // Is this docker instance local or remote?
    // It affects our assumptions with volume paths.
    // For now we're just gonna hardcode local
    if (dockerHost) {
      dockerOpts = URI.parse(dockerHost)
      docker = new Docker(dockerOpts);
    } else if (fs.existsSync('/var/run/docker.sock')) {
      dockerOpts = { socketPath: '/var/run/docker.sock' };
      docker = new Docker(dockerOpts);
    } else {
      throw new Error("Failed to setup docker client");
    }
    return { docker: docker, local: true };
  }
}
