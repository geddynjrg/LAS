#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_root() {
  docker run --rm --privileged --net=host -v /:/host alpine chroot /host "$@"
}

install_file() {
  local src="$1"
  local dest="$2"
  local mode="${3:-644}"
  run_root sh -c "cp '${src}' '${dest}' && chmod '${mode}' '${dest}'"
}

echo "Installing IP failover health check"
install_file "${SCRIPT_DIR}/uwezo-ip-failover-health.sh" /usr/local/sbin/uwezo-ip-failover-health.sh 755
install_file "${SCRIPT_DIR}/uwezo-ip-failover-health.service" /etc/systemd/system/uwezo-ip-failover-health.service 644
install_file "${SCRIPT_DIR}/uwezo-ip-failover-health.timer" /etc/systemd/system/uwezo-ip-failover-health.timer 644

run_root sh -c "mkdir -p /var/log && touch /var/log/uwezo-ip-failover-health.log"
run_root sh -c "ln -sf /etc/systemd/system/uwezo-ip-failover-health.timer /etc/systemd/system/timers.target.wants/uwezo-ip-failover-health.timer"
install_file "${SCRIPT_DIR}/uwezo-ip-failover-health.cron" /etc/cron.d/uwezo-ip-failover-health 644

echo "Running initial health check"
run_root /usr/local/sbin/uwezo-ip-failover-health.sh || true

echo "Installed. Enable with: systemctl start uwezo-ip-failover-health.timer"
echo "Logs: /var/log/uwezo-ip-failover-health.log"
