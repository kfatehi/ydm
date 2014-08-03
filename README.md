# dew

Dew is a tool to help manage and automate the complexity encountered in sophisticated uses of Docker.

> May my instructions descend like rain and may my words flow like dew, as light rain upon the grass, and as showers upon new plants.
>
> **Deuteronomy 32:2**

## Example Use Case

You want to deploy Gitlab, you find a good Image for it on the Docker Registry.

Reading the documentation, you see that the author recommends you use PostgreSQL via another Image.

You learn how docker does container links and how to manage those.

You setup the postgres container and write down the generated username and password so you can create the user and database for Gitlab on it using `psql` 

Ok that's done... now you need to spawn a temporary container with `rake` commands that you must attach to in order to input 'yes' when it asks -- no problem, done.

(For full version, check Sameer's docs at https://registry.hub.docker.com/u/sameersbn/gitlab/ )

Now you've done the delicate dance of setting up Gitlab properly, modularly, with Docker.

How do you keep track of all this complexity? How do you script it for next time? Can you?

Well, you can, and you should. Dew provides a way in which to do it -- this blueprint is called a dew drop.

Because docker images are tagged and versioned, you can safely freeze a workflow per a set of Images.

The dew drop provides simple namespaces and persistence (via JSON files on disk exposed as HTML5 localStorage api). In it you can describe the nature of container interconnection, exposure to the outside world, and whatever else may be necessary -- it's just JavaScript.

Finally, we want flexibility -- a dew drop is not a static blueprint but a living, changing one -- it has been designed by me to facilitate this. I hope I did a good job.

So whenever Sameer extracts Redis out of the Gitlab image and forces you to use that in a linked fashion too, you'll be ready, you'll just edit the dew drop accordingly and just `dew drop gitlab reinstall --namespace develop` until you get it right.

## Limitations

Although `dew` uses the Docker remote api, it needs to be installed and used directly on the docker host.

This is because `dew` manages volumes for you automatically and needs to be able to create and destroy folders within the `scope` (these can be found in `~/.dew`).

This can be easily solved by making `dew` itself provide/consume an HTTP api of its own. This may actually be a great idea considering that securing the Docker API is not really within in Docker's scope -- therefore `dew` could do it instead.
