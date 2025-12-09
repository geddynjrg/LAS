# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Copy nginx configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy custom entrypoint
COPY docker-entrypoint.sh /docker-entrypoint-custom.sh
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80 443

# Use custom entrypoint that generates certs if missing
ENTRYPOINT ["/docker-entrypoint-custom.sh"]
CMD ["nginx", "-g", "daemon off;"]