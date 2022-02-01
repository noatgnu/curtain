#!/bin/bash
node_modules/.bin/ng build -c=docker
service nginx stop
nginx -g "daemon off;" &
service nginx start
bash
