# Majuu Safaricom 41.139.233.34 — host config and remaining ISP work

Last updated: 2026-08-13 on `estdevsvr`. Local host work is done. **Inbound TCP 80/443 from the internet is still blocked on Safaricom/CPE.** Do not wait on this server for that change.

## What was configured (local)

| Item | Value |
|---|---|
| Interface | `eth1` (do not remove `.34`) |
| Address | `41.139.233.34/30` (also keeps `197.248.173.243/29`) |
| Gateway | `41.139.233.33` |
| Policy table | `201` |
| Policy rule | `from 41.139.233.34 lookup 201` |
| eth1 MAC | `00:15:5d:79:83:26` |
| Netplan | `/etc/netplan/00-installer-config.yaml` (already has `/30` + table 201 + policy) |

Policy table 201:

- `default via 41.139.233.33 dev eth1`
- `41.139.233.32/30 dev eth1`
- `172.18.0.0/16 dev br-fd19734358a1` — Docker nginx hairpin so `https://41.139.233.34:443` works **from this host**

Hairpin persist (survives reboot):

- Helper: `/usr/local/sbin/uwezo-table201-docker-hairpin.sh`
- Called every minute from `/usr/local/sbin/uwezo-route-failover.sh` (existing `uwezo-route-failover.timer`, `OnBootSec=30s`)
- The helper only `ip route replace 172.18.0.0/16 … table 201`. It never flushes table 201 and never deletes the default via `41.139.233.33`.
- Bridge is discovered live (`ip route show 172.18.0.0/16` / `uwezo-nginx-1`). Do not hard-code `br-fd19734358a1` after a docker network recreate.

Unchanged on purpose:

- `eth0` `10.190.12.249/24` (default metric 50)
- `eth2` `10.190.12.248/24` (default metric 60)
- `eth1` `197.248.173.243/29` (default metric 100)
- No `netplan apply` was run for this work
- `uwezo-route-failover.sh` still only moves the **main** default between eth0 NAT and eth1 `197.248.173.241`. It does not wipe `.34` or table 201.

Nginx (`uwezo-nginx-1`, source often `loan_app_staging/live_fix.conf`):

- `default_server` listens 80/443 on `0.0.0.0` and includes `server_name _ … 41.139.233.34`
- Local `/failover-health` returns **200** for `https://41.139.233.34/failover-health` and `Host: majuu` on `127.0.0.1`

## What is still blocked (external)

Windows / any host **outside** this machine:

```text
curl https://41.139.233.34:443  →  curl 28 (timeout)
```

Diagnosis: Safaricom CPE/upstream allows outbound and high-port inbound, but **drops unsolicited inbound TCP 80 and 443** to `41.139.233.34`. Host nginx and docker-proxy are fine.

**Safaricom must allow inbound TCP 80 and TCP 443 to 41.139.233.34** (MAC `00:15:5d:79:83:26`, gateway `41.139.233.33`). Until that is done, clients hitting this A record will hang.

Treasury DNS: this host **cannot** change it. Until 443 works from the internet:

- **Remove** `41.139.233.34` from `majuu.uwezo.go.ke`
- **Keep** `41.76.170.248`

As of 2026-08-13 both A records are still published (`41.139.233.34` and `41.76.170.248`), so about half of clients can time out.

## Verify on this host

```bash
ip addr show eth1
ip rule
ip route show table 201
ip route show default
ping -c 1 -I 41.139.233.34 41.139.233.33
curl -sk --connect-timeout 4 https://41.139.233.34/failover-health
curl -sk --connect-timeout 4 -H "Host: majuu" https://127.0.0.1/failover-health
# expect 200 JSON: {"status":"ok",...}
```

Expect table 201 to contain **both** `default via 41.139.233.33` and `172.18.0.0/16 dev br-…`.

## Verify from Windows (after Safaricom opens 80/443)

```bat
curl.exe -sk --connect-timeout 8 https://41.139.233.34/failover-health
curl.exe -sk --connect-timeout 8 -H "Host: majuu.uwezo.go.ke" https://41.139.233.34/failover-health
nslookup majuu.uwezo.go.ke
```

Success: HTTP 200 JSON with `"status":"ok"`. Failure today: `curl 28` timeout. High-port inbound already working does **not** mean 80/443 are open.

## Rollback

Remove only the Docker hairpin persist (keeps `.34` on eth1, as requested):

```bash
# restore failover script from backup
docker run --rm --privileged --pid=host --net=host -v /:/host alpine chroot /host \
  cp /usr/local/sbin/uwezo-route-failover.sh.bak-233-34 /usr/local/sbin/uwezo-route-failover.sh
docker run --rm --privileged --pid=host --net=host -v /:/host alpine chroot /host \
  rm -f /usr/local/sbin/uwezo-table201-docker-hairpin.sh
ip route del 172.18.0.0/16 table 201 || true
```

Remove the Majuu `/30` **only if explicitly asked** (user wanted this connection kept):

```bash
# DO NOT run unless leaving the Safaricom Majuu path
ip addr del 41.139.233.34/30 dev eth1
ip rule del from 41.139.233.34 lookup 201
ip route flush table 201
# then edit /etc/netplan/00-installer-config.yaml and apply with a snapshot
```

## Files

| Path | Role |
|---|---|
| `/etc/netplan/00-installer-config.yaml` | Live netplan (root 600) |
| `/home/administrator/netplan/00-installer-config.yaml` | Workspace copy |
| `/usr/local/sbin/uwezo-table201-docker-hairpin.sh` | Hairpin helper |
| `/usr/local/sbin/uwezo-route-failover.sh` | Outbound failover + hairpin ensure |
| `/usr/local/sbin/uwezo-route-failover.sh.bak-233-34` | Pre-hairpin failover backup |
| `/home/administrator/loan_app_staging/live_fix.conf` | Nginx source (`default_server` includes `.34`) |
