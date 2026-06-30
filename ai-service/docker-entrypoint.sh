#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/app/generated/tryon /app/uploads
  chown -R aiservice:aiservice /app/app/generated/tryon /app/uploads
  exec gosu aiservice "$@"
fi

exec "$@"
