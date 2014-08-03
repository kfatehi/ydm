# dew

## What

Dew is a tool to help manage and automate the complexity encountered in sophisticated uses of Docker.

## Why

You want to deploy Gitlab, you find a good Image for it on the Docker Registry.

Reading the documentation, you see that the author recommends you use PostgreSQL via another Image.

You learn how docker does container links and how to manage those.

You setup the postgres container and write down the generated username and password so you can create the user and database for Gitlab on it using `psql` 

Ok that's done... now you need to spawn a temporary container with `rake` commands that you must attach to in order to input 'yes' when it asks -- no problem, done.

(For full version, check Sameer's docs at https://registry.hub.docker.com/u/sameersbn/gitlab/ )

Now you've done the delicate dance of setting up Gitlab properly, modularly, with Docker.

How do you keep track of all this complexity? How do you script it for next time? Can you?

Well, you can, and you should. Dew provides a way in which to do it -- this blueprint is called a dew drop.

Because docker images are tagged and versioned, you can safely freeze a workflow per a set of Images and the nature of their interconnection and exposure to the outside world. Even so, we want flexibility -- a dew drop is not a static blueprint but a living, changing one (pull requests).

So whenever Sameer extracts Redis out of the Gitlab image and forces you to use that in a linked fashion too, you'll be ready, you'll just edit the dew drop accordingly.
