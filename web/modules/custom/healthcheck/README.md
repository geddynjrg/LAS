
# `healthcheck` Module for Drupal

The `healthcheck` module provides a flexible health check framework for monitoring various system components and external services in Drupal environments. The module is designed to work seamlessly in Kubernetes and CI/CD environments without requiring additional configurations. It uses a plugin-based architecture that allows for easy extension, making it simple to add custom health checks.

## Features

- **Plugin-Based Health Checks**: Each health check is implemented as a plugin, allowing you to extend or modify the checks as needed.
- **Predefined Health Check Plugins**:
  - **Database Connection Check**: Ensures the application can connect to the database.
  - **Redis Connection Check**: Verifies the Redis cache connection.
  - **Cron Job Status**: Returns the last cron run, whether a cron job is in progress, and the status of various queues.
  - **S3 Connection Check**: Validates S3 connection and bucket access via the `s3fs` module.
  - **External Service Health Check**: Asynchronously checks the status of defined external services via HTTP.
  - **Application Status Check**: Provides basic app status information such as uptime.
  - **Application Version Check**: Retrieves the current version of the application from the `package.json` file, typically managed by Semantic Release.

## Architecture Overview

The `healthcheck` module follows a plugin-based architecture where each health check is encapsulated as a plugin. These plugins are managed by a central `HealthCheckPluginManager`. The system is designed for asynchronous execution of health checks to improve performance, especially when checking external services.

- **Plugin System**: Health check plugins implement the `HealthCheckPluginInterface`. This ensures that each plugin has a `runHealthCheck` method that returns the status and details of the health check.
- **Asynchronous Execution**: External services are checked asynchronously using Guzzle promises, allowing multiple services to be checked in parallel without blocking the request.
- **No Configuration Required**: The module is designed to work out of the box, without needing additional configuration files or settings in the `settings.php`.

## Available Plugins

The following plugins are provided by default:

1. **DatabaseHealthCheck**: Checks the connection to the database.
2. **RedisHealthCheck**: Checks the connection to Redis.
3. **CronHealthCheck**: Provides the status of the cron job system, including queue states.
4. **S3HealthCheck**: Verifies the connection and access to an S3 bucket (requires the `s3fs` module).
5. **ExternalServiceHealthCheck**: Checks the status of external services via HTTP.
6. **AppStatusHealthCheck**: Provides the basic status of the application, including uptime.
7. **AppVersionHealthCheck**: Retrieves the current version of the application from `package.json`.

## Endpoint

The module provides a single health check endpoint at:

```
/healthz
```

This endpoint returns a JSON response with the results of all the health checks that have been defined.

### Example Response

```json
{
  "version": "1.0.9",
  "cron": {
    "last_run": 1726605481,
    "time_since_last_run": 44,
    "cron_in_progress": "Idle",
    "queues": {
      "entity_reference_revisions_orphan_purger": {
        "items": 0,
        "status": "Empty"
      },
      "entity_usage_regenerate_queue": {
        "items": 0,
        "status": "Empty"
      },
      "locale_translation": {
        "items": 0,
        "status": "Empty"
      },
      "media_entity_thumbnail": {
        "items": 0,
        "status": "Empty"
      },
      "tehik_form_service_queue_worker": {
        "items": 0,
        "status": "Empty"
      },
      "tehik_tome_cleanup_queue": {
        "items": 0,
        "status": "Empty"
      },
      "tehik_tome_export_queue": {
        "items": 0,
        "status": "Empty"
      },
      "tome_static_cron": {
        "items": 0,
        "status": "Empty"
      }
    }
  },
  "redis": {
    "status": "UP",
    "message": "Redis connection is healthy."
  },
  "external_service": {
    "form_service": {
      "status": "UP",
      "endpoint": "https://form-service.k8s1.arendus.tehik.ee/healthz",
      "response_code": 200,
      "error": null
    }
  },
  "elasticsearch": {
    "status": "DISABLED",
    "message": "Elasticsearch is disabled."
  },
  "status": "UP",
  "app": {
    "status": "UP",
    "message": "Application is running normally.",
    "uptime": "up 6 days, 11 hours, 28 minutes"
  },
  "s3": {
    "status": "UP",
    "message": "S3 connection is healthy."
  },
  "database": {
    "status": "UP",
    "message": "Database connection is healthy."
  }
}
```

### Response Structure

- **status**: General application status (usually "UP" if no critical failures).
- **cron**: Detailed status of the cron system, including the last run, queue statuses, and whether cron is currently running.
- **version**: The current version of the application, typically retrieved from `package.json`.
- **redis**: Redis connection status, with details about whether the connection is healthy.
- **app**: General application status and uptime information.
- **s3**: Status of the connection to S3, including bucket access.
- **elasticsearch**: Elasticsearch connection status (if applicable).
- **database**: Database connection status.
- **external_service**: The status of defined external services, such as a form service.

## Adding New Plugins

The module is designed to be easily extensible. To add a new health check, simply create a new plugin by following the steps below:

1. **Create a new class in the `src/Plugin/HealthCheck` directory**:

   Example: `src/Plugin/HealthCheck/MyCustomHealthCheck.php`

   ```php
   <?php

   namespace Drupal\healthcheck\Plugin\HealthCheck;

   use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
   use Drupal\Component\Plugin\PluginBase;

   /**
    * Defines a plugin for checking a custom service.
    *
    * @HealthCheck(
    *   id = "my_custom_health_check",
    *   label = @Translation("My Custom Health Check")
    * )
    */
   class MyCustomHealthCheck extends PluginBase implements HealthCheckPluginInterface {

     /**
      * {@inheritdoc}
      */
     public function runHealthCheck(): array {
       // Add your health check logic here.
       return [
         'status' => 'UP',
         'message' => 'Custom service is healthy.'
       ];
     }

   }
   ```

2. **Clear the cache**:

   After adding the new plugin, clear the cache to register it:

   ```bash
   drush cr
   ```

3. **Your new health check will now be included in the `/health` endpoint response.**

## Extensibility and Customization

- **Add New Plugins**: Easily add new health check plugins by following the steps outlined above. Each plugin should implement the `HealthCheckPluginInterface` and define a `runHealthCheck` method.
- **Asynchronous Execution**: If your new plugin involves external service calls, you can use Guzzle promises to make asynchronous HTTP requests, improving performance.

## Example Workflow for Adding a New Plugin

1. Create a new class for the plugin in `src/Plugin/HealthCheck/`.
2. Implement the `HealthCheckPluginInterface` and define the `runHealthCheck` method.
3. Add your custom logic in the `runHealthCheck` method (e.g., querying a service, checking file system access, etc.).
4. Clear the cache to register the plugin.
5. The new plugin will automatically be included in the `/health` endpoint response.

---
