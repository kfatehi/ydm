# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.provider "virtualbox" do |v|
    v.memory = 2048
    v.cpus = 2
  end
  config.vm.provision "shell", inline: <<-EOF
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get -y upgrade
    apt-get install -y nodejs npm postgresql-client
    update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10
    curl -sSL https://get.docker.io/ubuntu/ | sudo sh
    chown vagrant /var/run/docker.sock
    cd /vagrant && npm link
  EOF
end
