# Fix: Applications Not Appearing on LMS

This guide fixes loan applications that are submitted on the staging portal but never reach the LMS.

## Problem summary

Applications follow an **async pipeline**:

1. User submits on `loans-staging.uwezo.go.ke` → saved in the **web** database (Prisma)
2. A **sync worker** processes `sync_queue` → POSTs to **Drupal admin** (`/api/v1/application`)
3. On success → POSTs to **LMS** (`LMS_API_URL/api/v1/application`)

If step 2 or 3 does not run, applications stay local and never appear in LMS.

## Root causes

| Issue | Symptom | Fix |
|-------|---------|-----|
| Sync worker not running | `sync_queue` rows stuck in `PENDING` | Start `sync-worker` service or add host cron |
| Web container cannot reach LMS | `lmsSyncError = fetch failed` | Allowlist server IP on LMS firewall |
| Wrong LMS URL | Data sent to production LMS | Set `LMS_API_URL` / `LMS_API_KEY` for the correct environment |
| Public API URL from container | HTML errors in sync queue | Use internal `http://admin` (fixed in `docker-compose.yml`) |
| Old Docker images | Code changes not visible | Rebuild and redeploy images |

---

## Step 1 — Pull latest code and rebuild

```bash
cd /home/administrator/Loan_Application
git pull

docker compose build web admin nginx
docker compose up -d
```

Verify all services are up:

```bash
docker compose ps
```

Expected: `web`, `admin`, `db`, `nginx`, and **`sync-worker`** all running.

---

## Step 2 — Confirm environment variables (server `.env`)

Edit the server `.env` (not committed to git):

```bash
# Drupal API (server-side sync — overridden in docker-compose to http://admin)
EXTERNAL_API_KEY=<your-drupal-api-key>

# LMS — must be reachable from the web/sync-worker containers
# LMS — staging environment
# Public URL (browser): https://lms-staging.uwezo.go.ke
# Server-side sync uses internal Docker URL (set in docker-compose.yml):
LMS_INTERNAL_API_URL=http://uwezo-lms-app:8000
LMS_API_HOST=lms-staging.uwezo.go.ke
LMS_API_URL=https://lms-staging.uwezo.go.ke          # overridden at runtime by LMS_INTERNAL_API_URL
LMS_API_KEY=<your-lms-staging-api-key>

# Cron auth for /api/cron/sync-applications
CRON_SECRET=<same-as-EXTERNAL_API_KEY-or-dedicated-secret>

# Sync interval (minutes) for sync-worker container
SYNC_INTERVAL_MINUTES=5

# Staging domains
WEB_DOMAIN=loans-staging.uwezo.go.ke
ADMIN_DOMAIN=loans-staging-admin.uwezo.go.ke
```

Restart after changes:

```bash
docker compose up -d
```

---

## Step 3 — Start the sync worker

The `sync-worker` service calls `/api/cron/sync-applications` every `SYNC_INTERVAL_MINUTES`.

```bash
docker compose up -d sync-worker
docker compose logs -f sync-worker
```

You should see lines like:

```
Sync OK: {"success":true,"processed":N,...}
```

> **Note:** Rebuild the web image after pulling these fixes:
> `docker compose build web && docker compose up -d web sync-worker`

### Alternative: host cron (if you prefer not to run sync-worker container)

```bash
crontab -e
```

Add (adjust path):

```cron
*/5 * * * * docker compose -f /home/administrator/Loan_Application/docker-compose.yml exec -T web wget -qO- --timeout=120 --header="Authorization: Bearer YOUR_CRON_SECRET" --post-data="" http://127.0.0.1:3000/api/cron/sync-applications >> /var/log/uwezo-sync.log 2>&1
```

> Do **not** call `localhost:3000` from the host — port 3000 is not published. Always exec into the `web` container or use the `sync-worker` service.

---

## Step 4 — Fix LMS network access (same-server / staging)

When LMS runs on the **same server** as the loan app (e.g. `lms-staging.uwezo.go.ke` → `41.76.170.249`), Docker containers **cannot** reach it via the public HTTPS URL (hairpin NAT timeout). Use the **internal Docker URL** instead:

```bash
# In .env
LMS_INTERNAL_API_URL=http://uwezo-lms-app:8000
LMS_API_HOST=lms-staging.uwezo.go.ke
```

`docker-compose.yml` connects the `web` container to the `uwezo-network` and sets `LMS_API_URL` from `LMS_INTERNAL_API_URL`.

Verify from the web container after restart:

```bash
docker compose exec web node -e \
  "fetch('http://uwezo-lms-app:8000/api/v1/application',{method:'POST',headers:{'X-API-Key':process.env.LMS_API_KEY,'Content-Type':'application/json','Host':process.env.LMS_API_HOST},body:'{}',signal:AbortSignal.timeout(10000)}).then(r=>console.log('OK',r.status)).catch(e=>console.log('FAIL',e.message))"
```

You should get `OK 400` or `OK 401` with a **validation** error — not `FAIL` / timeout / `ip_not_allowed`.

### LMS Horizon / Redis (required for applications to appear in UI)

LMS accepts API requests immediately but **persists them via a background queue**. If Horizon cannot reach Redis, nothing appears in the UI.

In `lms_app_staging/.env`:

```bash
REDIS_HOST=uwezo-lms-redis
```

Restart LMS workers after changing:

```bash
cd /home/administrator/lms_app_staging
docker compose restart horizon app scheduler
docker exec uwezo-lms-horizon php artisan config:clear
```

Verify Horizon can reach Redis:

```bash
docker exec uwezo-lms-horizon php -r 'require "/var/www/html/vendor/autoload.php"; $app=require "/var/www/html/bootstrap/app.php"; $app->make("Illuminate\\Contracts\\Console\\Kernel")->bootstrap(); Illuminate\\Support\\Facades\\Redis::connection()->ping(); echo "ok\n";'
```

LMS staging rejects requests from Docker container IPs by default (`ip_not_allowed`). Add the loan **web container IP** to LMS `.env`:

```bash
# On the LMS container (uwezo-lms-app)
ALLOWED_IP_3=172.22.0.6   # web container on uwezo-network (check with docker inspect uwezo-web-1)
ALLOWED_IP_4=172.18.0.6   # web container on uwezo_default
```

Then clear LMS config cache:

```bash
docker exec uwezo-lms-app php /var/www/html/artisan config:clear
```

> Container IPs can change after `docker compose up --force-recreate`. For a permanent fix, extend LMS `SecureApiAccess` middleware to support CIDR ranges (e.g. `172.16.0.0/12`).

```bash
docker compose exec web node -e \
  "fetch('https://lms-staging.uwezo.go.ke',{signal:AbortSignal.timeout(10000)}).then(r=>console.log('OK',r.status)).catch(e=>console.log('FAIL',e.message))"
```

---

## Step 5 — Retry stuck applications

After sync worker and LMS connectivity are fixed:

### Option A — Let the worker drain the queue

Wait 5–10 minutes. Check queue status:

```bash
docker compose exec db mariadb -u drupal -p"$DB_PASSWORD" web -e \
  "SELECT status, COUNT(*) FROM sync_queue GROUP BY status;"
```

### Option B — Manual trigger (one-off)

```bash
docker compose exec web wget -qO- --timeout=120 \
  --header="Authorization: Bearer $CRON_SECRET" \
  --post-data="" \
  http://127.0.0.1:3000/api/cron/sync-applications
```

### Option C — Admin UI

Open `https://loans-staging.uwezo.go.ke/admin/sync-queue` and retry failed items.

---

## Step 6 — Verify end-to-end

Check recent applications:

```bash
docker compose exec db mariadb -u drupal -p"$DB_PASSWORD" web -e "
SELECT applicationId, status, syncStatus, lmsSyncStatus, LEFT(lmsSyncError,80) AS lms_err
FROM applications
ORDER BY createdAt DESC LIMIT 10;"
```

Success looks like:

- `syncStatus = COMPLETED`
- `lmsSyncStatus = COMPLETED`
- `lmsSyncError = NULL`

Confirm in LMS admin UI that the application ID appears.

---

## Step 7 — Fix the email queue cron path (optional)

If mail queue cron still points at `/loans/docker-compose.yml`, update it:

```cron
* * * * * docker compose -f /home/administrator/Loan_Application/docker-compose.yml exec -T admin /var/www/html/vendor/bin/drush queue:run symfony_mailer_queue >> /var/log/uwezo-mail-queue.log 2>&1
```

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `syncStatus = PENDING` | Worker not running | Start `sync-worker`, check logs |
| `Unexpected token '<'` in sync_queue.error | Non-JSON/HTML from API | Confirm `API_URL=http://admin` in web container env |
| `lmsSyncError = fetch failed` | LMS unreachable | Firewall / allowlist |
| `lmsSyncStatus = PENDING` with Drupal COMPLETED | LMS sync queued for retry | Fix LMS network, wait for worker |
| Submitted apps still DRAFT | User did not complete submit step | Check application status in web DB |

Monitor sync worker logs:

```bash
docker compose logs -f sync-worker
```

Monitor web sync processing:

```bash
docker compose logs -f web | grep -E 'CRON|SyncWorker|sync queue|LMS'
```
