FROM nginx:alpine

# Copy static content
COPY index.html /usr/share/nginx/html/

# Configure Nginx to serve with no-cache headers
RUN echo "server {" > /etc/nginx/conf.d/default.conf && \
    echo "    listen       80;" >> /etc/nginx/conf.d/default.conf && \
    echo "    server_name  localhost;" >> /etc/nginx/conf.d/default.conf && \
    echo "    location / {" >> /etc/nginx/conf.d/default.conf && \
    echo "        root   /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf && \
    echo "        index  index.html;" >> /etc/nginx/conf.d/default.conf && \
    echo "        add_header Cache-Control 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';" >> /etc/nginx/conf.d/default.conf && \
    echo "        expires off;" >> /etc/nginx/conf.d/default.conf && \
    echo "        add_header Last-Modified \$date_gmt;" >> /etc/nginx/conf.d/default.conf && \
    echo "        if_modified_since off;" >> /etc/nginx/conf.d/default.conf && \
    echo "        etag off;" >> /etc/nginx/conf.d/default.conf && \
    echo "    }" >> /etc/nginx/conf.d/default.conf && \
    echo "}" >> /etc/nginx/conf.d/default.conf

EXPOSE 80