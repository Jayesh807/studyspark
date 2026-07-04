#!/usr/bin/env bash
# Dev server watchdog — restarts the Next.js dev server if it dies or stops responding.
# Designed to be daemonized via start-stop-daemon (PPID=1, survives across shell calls).
# Logs to /home/z/my-project/watchdog.log

DEV_PIDFILE="/home/z/my-project/dev.pid"
DEV_LOG="/home/z/my-project/dev.log"
WD_LOG="/home/z/my-project/watchdog.log"
PORT=3000

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$WD_LOG"
}

start_dev() {
  # Truncate log to keep it manageable
  : > "$DEV_LOG"
  start-stop-daemon --start --background --make-pidfile \
    --pidfile "$DEV_PIDFILE" \
    --startas /bin/bash -- /home/z/my-project/start-dev.sh
  log "Started dev server (pidfile=$DEV_PIDFILE)"
}

is_responding() {
  # Returns 0 (true) if the server responds with HTTP 200 on /
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://localhost:$PORT" 2>/dev/null)
  [ "$code" = "200" ]
}

log "=== Watchdog started ==="
# Ensure dev server is up at launch
if ! is_responding; then
  log "Dev server not responding at launch — starting it."
  start_dev
  sleep 8
fi

# Main loop — check every 30 seconds
while true; do
  sleep 30
  if ! is_responding; then
    log "Dev server unresponsive — restarting."
    # Kill any stale next processes on the port
    pkill -9 -f "next dev -p 3000" 2>/dev/null
    pkill -9 -f "next-server" 2>/dev/null
    sleep 2
    start_dev
    sleep 10
    if is_responding; then
      log "Dev server recovered."
    else
      log "Dev server still down after restart — will retry next cycle."
    fi
  fi
done
