# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Copy nginx configuration template
COPY default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80 443

# nginx:alpine already has proper entrypoint to process templates
CMD ["nginx", "-g", "daemon off;"]