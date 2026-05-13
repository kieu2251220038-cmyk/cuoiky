FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js
COPY config.js /usr/share/nginx/html/config.js
COPY config.template.js /usr/share/nginx/html/config.template.js
COPY docker-entrypoint.sh /docker-entrypoint-custom.sh

RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80

CMD ["/docker-entrypoint-custom.sh"]
