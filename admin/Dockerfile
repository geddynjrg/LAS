# syntax=docker/dockerfile:1
# Multi-stage optimized Dockerfile for Drupal 11 with PHP 8.3
ARG PHP_VERSION=8.3

# Dependencies stage - install system packages and PHP extensions
FROM php:${PHP_VERSION}-fpm-alpine AS deps

# Install system dependencies and PHP extensions required by Drupal 11
RUN apk add --no-cache \
        freetype \
        freetype-dev \
        libjpeg-turbo \
        libjpeg-turbo-dev \
        libpng \
        libpng-dev \
        libwebp \
        libwebp-dev \
        libxml2-dev \
        libzip \
        libzip-dev \
        oniguruma-dev \
        mariadb-client \
        git \
        curl \
        zip \
        unzip \
        nginx \
        supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        mbstring \
        xml \
        gd \
        zip \
        opcache \
    && apk del freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev libxml2-dev libzip-dev oniguruma-dev

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Production stage - single composer install
FROM deps AS production

WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Copy all application files
COPY --chown=www-data:www-data . .

# Copy custom PHP configuration
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Copy nginx configuration
COPY docker/admin-nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Install all dependencies and run scaffold scripts in one step
RUN --mount=type=cache,target=/tmp/composer \
    COMPOSER_CACHE_DIR=/tmp/composer \
    composer install \
        --no-dev \
        --prefer-dist \
        --no-interaction \
        --optimize-autoloader

# Create necessary directories and set permissions
RUN mkdir -p web/sites/default/files /var/www/private /var/log/supervisor /run/nginx \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 web/sites/default \
    && chmod -R 775 web/sites/default/files

# PHP-FPM configuration to run as www-data
RUN sed -i 's/user = nobody/user = www-data/' /usr/local/etc/php-fpm.d/www.conf && \
    sed -i 's/group = nobody/group = www-data/' /usr/local/etc/php-fpm.d/www.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]