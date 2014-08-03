#!/bin/bash
# sometimes you get a "read parent syncpipe" error when a zombie container is left behind
# the zombie is revealed upon a restart of the docker daemon
function removeContainers() {
  sudo docker ps -a | tail -n +2 | awk '{ print $1 }' | xargs sudo docker rm -f
}

sudo rm -rf ~/.dew
removeContainers
sudo service docker restart
removeContainers
