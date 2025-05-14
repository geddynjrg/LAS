# Makefile

.PHONY: help install check test phpcs phpcbf phpstan phpunit grumphp drupal-check clear-cache

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

TARGET_MAX_CHAR_NUM=20

## Shows help
help:
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${YELLOW}%-$(TARGET_MAX_CHAR_NUM)s${RESET} ${GREEN}%s${RESET}\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

## Install dependencies
install:
	composer install

## Run all code quality checks
check: grumphp phpcs phpstan drupal-check

## Run GrumPHP checks
grumphp:
	vendor/bin/grumphp run

## Run PHPCS checks
phpcs:
	vendor/bin/phpcs --standard=Drupal,DrupalPractice web/modules/custom

## Fix code style automatically with PHPCBF
phpcbf:
	vendor/bin/phpcbf --standard=Drupal,DrupalPractice web/modules/custom

## Run PHPStan analysis
phpstan:
	vendor/bin/phpstan analyse web/modules/custom --memory-limit=256M

## Run PHPUnit tests
phpunit:
	vendor/bin/phpunit

## Run Drupal-check for deprecations
drupal-check:
	vendor/bin/drupal-check web/modules/custom

## Clear Drupal caches
clear-cache:
	drush cr

## Run code style checks
lint:
	vendor/bin/phpcs --standard=Drupal,DrupalPractice web/modules/custom
	vendor/bin/phpstan analyse web/modules/custom --memory-limit=256M

## Fix code style
fix-style:
	vendor/bin/phpcbf --standard=Drupal,DrupalPractice web/modules/custom -d memory_limit=512M --ignore=*/web/modules/custom/tvet_dashboard/js/react-app/*,*/node_modules/*

## Run security checks
security-check:
	composer audit
	vendor/bin/security-checker security:check

## Run all tests and checks
test: check phpunit security-check

## Validate composer.json
validate:
	composer validate --strict

## Update dependencies
update:
	composer update

## Export configuration
config-export:
	drush config:export --yes

## Import configuration
config-import:
	drush config:import --yes

## Fix PHP code style with PHP-CS-Fixer
fix:
	PHP_CS_FIXER_IGNORE_ENV=1 vendor/bin/php-cs-fixer fix --config=.php-cs-fixer.dist.php

## Check PHP code style with PHP-CS-Fixer (dry-run)
check-cs:
	PHP_CS_FIXER_IGNORE_ENV=1 vendor/bin/php-cs-fixer fix --config=.php-cs-fixer.dist.php --dry-run --diff
