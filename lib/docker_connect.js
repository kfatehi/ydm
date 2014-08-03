"use strict";
var fs = require('fs')
  , dockerHost = process.env.DOCKER_HOST
  , Docker = require('dockerode')
  , dockerOpts = null
  , local = null
  , URI = require("uri-js")

function getMyIPAddresses() {
  var ifaces = require('os').networkInterfaces();
  return _.pluck(_.flatten(_.map(ifaces, function (eth) {
    return _.map(eth, function(addr) { return addr })
  })), 'address')
};

module.exports = function () {
  var docker = null, local = null, dockerOpts = null;
  // Is this docker instance local or remote?
  // It affects our assumptions with volume paths.
  if (dockerHost) {
    dockerOpts = URI.parse(dockerHost)
    // this is not bulletproof -- you might be using dns, etc
    local = _.contains(getMyIPAddresses(), dockerOpts.host)
    docker = new Docker(dockerOpts);
  } else if (fs.existsSync('/var/run/docker.sock')) {
    local = true
    dockerOpts = { socketPath: '/var/run/docker.sock' };
    docker = new Docker(dockerOpts);
  } else {
    throw new Error("Failed to setup docker client");
  }
  return { docker: docker, local: local };
}
