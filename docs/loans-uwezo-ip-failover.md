# loans.uwezo.go.ke Dual-IP Failover

## Current topology

| IP | Role | Interface | Status |
|---|---|---|---|
| `41.76.170.249` | Primary public (ISP NAT) | `eth0` → `10.190.12.249` | Working — NAT on ISP router |
| `197.248.173.243` | Secondary public (Safaricom) | `eth1` direct (`00:15:5d:79:83:26`), gateway `197.248.173.241` | **Local OK; not reachable externally** |

DNS (`ns1/ns2/ns3.treasury.go.ke`) publishes **both** A records. Clients resolve one IP at random (~50% hit the dead address).

Nginx (`uwezo-nginx-1`) publishes `0.0.0.0:80` and `0.0.0.0:443`. Once both public IPs route to this host, no nginx listen change is required.

## What works on this server today

- Nginx serves `loans.uwezo.go.ke` on localhost, `10.190.12.249`, and `197.248.173.243` (eth1)
- IP-based health probe: `https://41.76.170.249/failover-health` and `https://197.248.173.243/failover-health` (no Host header required)
- Outbound route failover script prefers `eth0` NAT, falls back to `eth1` Safaricom (`/usr/local/sbin/uwezo-route-failover.sh`)
- Health monitor: `/usr/local/sbin/uwezo-ip-failover-health.sh` (every 5 min via timer)
- Failover probe endpoint: `https://loans.uwezo.go.ke/failover-health`

## Required network team actions

### Option A — Safaricom router ARP / static route (required for direct eth1 IP)

Server `eth1` MAC: `00:15:5d:79:83:26`, address: `197.248.173.243/24`, gateway: `197.248.173.241`.

On the Safaricom router (`197.248.173.241`):

1. Confirm `197.248.173.243` is assigned to this server's MAC (not held on the router LAN interface only).
2. Ensure upstream Safaricom routing advertises `197.248.173.243` to the internet (ping from external host must reach the server).
3. Allow inbound **TCP 80** and **TCP 443** to `197.248.173.243`.
4. Confirm from an **external** host: `curl -sk https://197.248.173.243/failover-health`

If the router previously NAT-forwarded to `192.168.1.172`, update rules now that the server uses the public IP directly on `eth1`.

### Option B — Safaricom port-forward (legacy / if direct IP not possible)

On the Safaricom router (`197.248.173.241`):

1. Forward **TCP 80** → server `eth1` `:80`
2. Forward **TCP 443** → server `eth1` `:443`
3. Confirm from an **external** host: `curl -sk https://197.248.173.243/failover-health`

### Option C — Direct secondary IP on server (done locally; Safaricom upstream still required)

Server already has `197.248.173.243/24` on `eth1` (see `uwezo-eth1-static.service`). Safaricom must still route that IP to MAC `00:15:5d:79:83:26` from the internet.

Verify locally: `ip addr show eth1` includes `197.248.173.243`.

### Option D — Safaricom load balancer / floating IP

Configure Safaricom to health-check both paths and present a single VIP, or automate VIP movement between links.

## DNS policy (Treasury team)

Until **both** IPs are externally reachable:

- **Remove** the dead A record (`197.248.173.243`) **or**
- Set low TTL (60–300s) and keep only the working IP active

When both IPs work, dual A records are acceptable with low TTL for faster client retry.

Recommended verification from outside this network:

```bash
dig +short loans.uwezo.go.ke A
curl -sk https://41.76.170.249/failover-health
curl -sk https://197.248.173.243/failover-health
```

## Install / verify on server

```bash
# Health monitoring
./scripts/install-ip-failover-health.sh
docker run --rm --privileged --net=host -v /:/host alpine chroot /host systemctl start uwezo-ip-failover-health.timer

# Outbound route failover (already installed)
./network-fix/apply-routing-fix.sh

# Reload nginx after config changes
docker exec uwezo-nginx-1 nginx -s reload
```

Check logs:

```bash
tail -f /var/log/uwezo-ip-failover-health.log
cat /var/run/uwezo-ip-failover-health.state
```

## How failover works

1. **Inbound (client → site):** Both public IPs must route to this server. Nginx accepts on all host interfaces via Docker `0.0.0.0:443`. DNS round-robin distributes clients; unreachable IP causes ~50% failures until DNS or routing is fixed.

2. **Outbound (server → internet):** `uwezo-route-failover.sh` prefers `eth0` NAT (`10.190.12.254`); if `eth0` cannot reach `8.8.8.8`, switches default route to `eth1` via `197.248.173.241`.

3. **Monitoring:** Health script checks local nginx, interface binding, and both public IPs every 5 minutes. Partial failure writes `/var/run/uwezo-ip-failover-health.alert` with the IP DNS should prefer.

Automated DNS swap requires Treasury DNS API access (not available on this server).
