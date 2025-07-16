# Log Monitoring Setup

This directory contains the configuration for log monitoring using the Grafana + Loki + Promtail stack.

## Architecture

- **Loki**: Log aggregation system that stores and indexes logs
- **Promtail**: Agent that collects logs from Docker containers and sends them to Loki
- **Grafana**: Visualization dashboard for viewing and analyzing logs

## Services

### Loki (Port 3101)

- Stores and indexes application logs
- Provides a query API for log retrieval
- Lightweight alternative to Elasticsearch

### Promtail

- Collects logs from Docker containers automatically
- Configured to read from `/var/lib/docker/containers/`
- Sends logs to Loki with proper labeling

### Grafana (Port 3002)

- Web UI for viewing logs and creating dashboards
- Default credentials: `admin` / `admin123`
- Pre-configured with Loki as a datasource

## Getting Started

1. **Start the monitoring stack:**

   ```bash
   docker-compose up -d
   ```

2. **Access Grafana:**

   - Open http://localhost:3002
   - Login with username: `admin`, password: `admin123`

3. **View logs:**
   - Navigate to the "Uwezo Application Logs" dashboard
   - Or go to Explore > Loki to query logs manually

## Log Queries Examples

### View all uwezo app logs:

```logql
{job="containerlogs", container_name=~".*uwezo.*"}
```

### Filter by log level:

```logql
{job="containerlogs", container_name=~".*uwezo.*"} |= "ERROR"
```

### Search for specific text:

```logql
{job="containerlogs", container_name=~".*uwezo.*"} |= "authentication"
```

### Count errors over time:

```logql
sum(rate({job="containerlogs", container_name=~".*uwezo.*"} |= "ERROR" [5m]))
```

## Dashboard Features

The pre-configured dashboard includes:

- **Log Volume by Container**: Pie chart showing log distribution
- **Log Rate by Container**: Time series of log rates
- **Container Logs**: Real-time log viewer for all containers
- **Uwezo App Logs**: Filtered view for uwezo application logs

## Configuration Files

- `promtail-config.yml`: Promtail configuration for log collection
- `grafana-datasources.yml`: Grafana datasource configuration
- `grafana-dashboards.yml`: Dashboard provisioning configuration
- `dashboards/uwezo-logs.json`: Pre-built dashboard for uwezo logs

## Troubleshooting

### Logs not appearing:

1. Check if containers are running: `docker-compose ps`
2. Verify Promtail is collecting logs: `docker-compose logs promtail`
3. Check Loki is receiving data: `curl http://localhost:3101/metrics`

### Grafana connection issues:

1. Verify Loki is accessible: `docker-compose logs loki`
2. Check datasource configuration in Grafana UI
3. Test connection in Grafana > Configuration > Data Sources

### Performance considerations:

- Log retention is handled by Loki's default settings (24h)
- Container logs are rotated (max 10MB, 3 files)
- For production, consider setting up proper log retention policies

## Next Steps

1. **Set up alerting**: Configure Grafana alerts for error rates
2. **Add structured logging**: Update your Next.js app to output JSON logs
3. **Create custom dashboards**: Build specific dashboards for your application metrics
4. **Log filtering**: Add log parsing rules in Promtail for better structure
