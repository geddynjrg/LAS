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

# Composer dependencies stage
FROM deps AS composer-deps
WORKDIR /var/www/html

# Copy composer files first for dependency caching
COPY composer.json composer.lock ./

# Install dependencies in separate layer (cached unless composer files change)
RUN --mount=type=cache,target=/tmp/composer \
    COMPOSER_CACHE_DIR=/tmp/composer \
    composer install \
        --no-dev \
        --prefer-dist \
        --no-interaction \
        --optimize-autoloader

# Production stage - final minimal image
FROM deps AS production


WORKDIR /var/www/html

# Copy application files first (excluding vendor to avoid overwriting)
COPY --chown=www-data:www-data . .

# Copy vendor dependencies from composer stage  
COPY --from=composer-deps --chown=www-data:www-data /var/www/html/vendor ./vendor

# Copy custom PHP configuration
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Complete the composer installation (install packages to proper locations)
RUN composer install --no-dev --optimize-autoloader

# Create necessary directories and set permissions
RUN mkdir -p web/sites/default/files /var/www/private \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 web/sites/default \
    && chmod -R 775 web/sites/default/files

# Switch to non-root user
USER www-data

EXPOSE 9000

CMD ["php-fpm"]