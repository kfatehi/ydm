#!/bin/bash
export VERBOSE=1
bash scripts/reset-all.sh
watchy -w . -i '/\\.|node_modules|\\.json$' -- sudo dew install gitlab --namespace "test.01" 2>&1 | node_modules/.bin/simple-stacktrace

