**Warning** This is pre-release software. I don't recommend you to try it unless you're sure it does what you expect which most likely means you contributed code to it.

---

# ydm

`ydm` is a command line tool to help manage and automate the complexity encountered in sophisticated uses of Docker.

## Requirements

`ydm` works on any machine that has Docker v1.1.1 or newer installed locally. See [ydm-api](https://github.com/keyvanfatehi/ydm-api) to use it remotely.

## Install

Use npm to install:

`npm install -g ydm`

## Usage Examples

Install [Strider-CD](https://github.com/Strider-CD/strider) in one command, and publish all ports.

`ydm install strider --publish`

That was easy considering that strider is self-contained. Let's try something more difficult.

Install [GitLab Community Edition](https://gitlab.com/gitlab-org/gitlab-ce/tree/master) in one command, and publish all ports.

`ydm install gitlab --namespace awesome --publish`

You will get useful JSON back on STDOUT.

## Other Software

You can create "drops" by looking at the current examples in the `drops/` directory. All you need to get started is a Docker image. For a simple example, look at the `postgresql` `ydm` drop.

If you need to store additional files, create a directory (e.g. `drops/gitlab/index.js`) -- but if it's something simple, you can just create a single file (e.g. `drops/postgresql.js`).

*Fork, automate, submit pull requests!*

## Testing Drops

You can add tests for your drop -- take a look at `test/drops/postgresql/test.js` for a simple example.

## Example Use Case

You want to deploy Gitlab, you find a good Image for it on the Docker Registry.

Reading the documentation, you see that the author recommends you use PostgreSQL via another Image.

You learn how docker does container links and how to manage those.

You setup the postgres container and write down the generated username and password so you can create the user and database for Gitlab on it using `psql` 

Ok that's done... now you need to spawn a temporary container with `rake` commands that you must attach to in order to input 'yes' when it asks -- no problem, done.

(For full version, check Sameer's docs at https://registry.hub.docker.com/u/sameersbn/gitlab/ )

Now you've done the delicate dance of setting up Gitlab properly, modularly, with Docker.

How do you keep track of all this complexity? How do you script it for next time? Can you?

Well, you can, and you should. `ydm` provides a way in which to do it -- this blueprint is called a `ydm` drop.

Because docker images are tagged and versioned, you can safely freeze a workflow per a set of Images.

The `ydm` drop provides simple namespaces and persistence (via JSON files on disk exposed as HTML5 localStorage api). In it you can describe the nature of container interconnection, exposure to the outside world, and whatever else may be necessary -- it's just JavaScript.

Finally, we want flexibility -- a `ydm` drop is not a static blueprint but a living, changing one -- it has been designed by me to facilitate this. I hope I did a good job.

So whenever Sameer extracts Redis out of the Gitlab image and forces you to use that in a linked fashion too, you'll be ready, you'll just edit the `ydm` drop accordingly and just `ydm reinstall gitlab --namespace develop` until you get it right.

## Remote API

Although `ydm` uses the Docker remote api, it needs to be installed and used directly on the docker host.

This is because `ydm` manages volumes for you automatically and needs to be able to create and destroy folders within the `scope` (these can be found in `~/.ydm`).

See [ydm-api](https://github.com/keyvanfatehi/ydm-api) if you're interested in using `ydm` remotely via HTTP API.

## Hacking

A Vagrantfile is included that sets up node, npm, and docker in an ubuntu box.

# Docs

## Destroy (and Reinstall)

Destroy (and reinstall, which depends on destroy) are soft and do no harm unless you activate one or more destructive switches:

`--removeVolumes` delete any volumes on disk associated with the container
`--removeLinks` recursively delete any other containers linked to the container
