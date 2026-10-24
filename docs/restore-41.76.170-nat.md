# Restore public reachability for 41.76.170.248 / 41.76.170.249

## Mapping (required on ISP/firewall at 10.190.12.254)

| Public IP | Internal IP | Interface | MAC | DNS hosts |
|-----------|-------------|-----------|-----|-----------|
| **41.76.170.249** | **10.190.12.249** | eth0 | 00:15:5d:79:83:0f | lms, lms-staging, loans, loans-admin, loans-staging, loans-staging-admin |
| **41.76.170.248** | **10.190.12.248** | eth2 | 00:15:5d:79:83:28 | majuu.uwezo.go.ke (+ /lms) |

## Firewall / router actions (outside this VM)

1. DNAT TCP 80,443: 41.76.170.249 -> 10.190.12.249 ; 41.76.170.248 -> 10.190.12.248
2. Allow ICMP echo to both publics (for ping) and forward to those internals
3. ARP: 10.190.12.249 -> 00:15:5d:79:83:0f ; 10.190.12.248 -> 00:15:5d:79:83:28
4. Test from an EXTERNAL host (not this server):
   ping 41.76.170.249
   ping 41.76.170.248
   curl -sk https://41.76.170.249/failover-health
   curl -sk https://majuu.uwezo.go.ke/lms/login

## Server status (already OK on 2026-10-12)

- eth0/eth2 UP, gateway reachable, nginx serves sites on internal IPs
- Policy table 202 returns traffic from 10.190.12.248 via eth2
- ICMP echo enabled
- These public IPs are NOT configured locally (correct for NAT)

## Why internet ping fails

41.76.170.248/.249 are edge-NAT publics. Timeouts mean firewall DNAT/upstream routing is broken — not that this server is down.
