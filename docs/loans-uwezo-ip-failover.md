# loans.uwezo.go.ke Dual-IP Failover

## Current topology

| IP | Role | Interface | Status |
|---|---|---|---|
| `41.76.170.249` | Primary public (ISP NAT) | `eth0` → `10.190.12.249` | Working — NAT on ISP router |
| `197.248.173.243` | Secondary public (Safaricom) | Not on server; gateway `197.248.173.241` on `eth1` (`192.168.1.172`) | **Not reachable externally** |

DNS (`ns1/ns2/ns3.treasury.go.ke`) publishes **both** A records. Clients resolve one IP at random (~50% hit the dead address).

Nginx (`uwezo-nginx-1`) publishes `0.0.0.0:80` and `0.0.0.0:443`. Once both public IPs route to this host, no nginx listen change is required.

## What works on this server today

- Nginx serves `loans.uwezo.go.ke` on localhost, `10.190.12.249`, and `192.168.1.172`
- Outbound route failover script prefers `eth0` NAT, falls back to `eth1` Safaricom (`/usr/local/sbin/uwezo-route-failover.sh`)
- Health monitor: `/usr/local/sbin/uwezo-ip-failover-health.sh` (every 5 min via timer)
- Failover probe endpoint: `https://loans.uwezo.go.ke/failover-health`

## Required network team actions

### Option A — Safaricom port-forward (fastest if direct IP assignment unavailable)

On the Safaricom router (`197.248.173.241`, public `197.248.173.243`):

1. Forward **TCP 80** → `192.168.1.172:80`
2. Forward **TCP 443** → `192.168.1.172:443`
3. Confirm from an **external** host: `curl -k -H 'Host: loans.uwezo.go.ke' https://197.248.173.243/failover-health`

### Option B — Direct secondary IP on server (preferred for true dual-homed failover)

Request Safaricom to assign `197.248.173.243/32` (or `/24`) routed to this server's `eth1` MAC.

Then apply netplan from `network-fix/00-installer-config.yaml`:

```bash
sudo cp network-fix/00-installer-config.yaml /etc/netplan/00-installer-config.yaml
sudo netplan apply
```

Verify: `ip addr show eth1` includes `197.248.173.243`.

### Option C — Safaricom load balancer / floating IP

Configure Safaricom to health-check both paths and present a single VIP, or automate VIP movement between links.

## DNS policy (Treasury team)

Until **both** IPs are externally reachable:

- **Remove** the dead A record (`197.248.173.243`) **or**
- Set low TTL (60–300s) and keep only the working IP active

When both IPs work, dual A records are acceptable with low TTL for faster client retry.

Recommended verification from outside this network:

```bash
dig +short loans.uwezo.go.ke A
curl -sk -H 'Host: loans.uwezo.go.ke' https://41.76.170.249/failover-health
curl -sk -H 'Host: loans.uwezo.go.ke' https://197.248.173.243/failover-health
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
