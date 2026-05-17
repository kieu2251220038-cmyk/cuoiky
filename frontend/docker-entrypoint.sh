#!/bin/sh
set -e

: "${API_BASE_URL:=http://localhost:8000/api}"
envsubst '${API_BASE_URL}' < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

nginx -g 'daemon off;'
