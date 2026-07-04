#!/usr/bin/env bash
# Dev server launcher — redirects all output to dev.log
# Designed to be daemonized via start-stop-daemon
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1280"
exec /home/z/my-project/node_modules/.bin/next dev -p 3000 --webpack >> /home/z/my-project/dev.log 2>&1
