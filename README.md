# dew

explanation from IRC

```
ok so basically heres the reason i built hyperdock
there are docker images aplenty
but there are a lot of shitty ones
the few good ones still require complex setup
someone has to go deconstruct this shit
and create curated "formulas"
if you're a mac user u know what im talking about... it's why brew exists
brew hooks you up with shit that "just works"
that's what dew does too
it takes the best of docker, and gives you a framework to wrap its install as a "dew drop"
you get 3 commands
dew list which shows you available dew drops
dew install <drop>
and dew destroy <drop>
the drop author handles complex shit like fetching other docker images, creating containers, linking them, the nuances command line shit
and spits out the relevant info that you need, like ports, etc
```

# Drops

## Ready

* gitlab
* postgresql

## WIP

* strider
