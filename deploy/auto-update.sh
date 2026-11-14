#!/bin/sh
# Added for the ERA RINF frontend, 2026-11-14. Licensed under the EUPL 1.2.
#
# Keeps the Location Code Manager on the NAS at the latest commit of master:
# asks GitHub for the latest commits of dagosan/abzuKG and dagosan/tiamatLCs
# and runs update.sh when either is new. Meant for the NAS's scheduler (cron),
# see deploy/README.md, "Update automatically":
#
#   wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/auto-update.sh | sh
#
# A pair of commits is tried once: if its build fails, the old containers keep
# serving and nothing is tried again until a new commit arrives. What happened
# is written to abzukg-auto-update.log next to the app folders.
set -eu

PARENT="${ABZUKG_DIR:-/share/Container}"
STATE="$PARENT/abzukg-auto-update.state"
LOG="$PARENT/abzukg-auto-update.log"
LOCK="$PARENT/abzukg-auto-update.lock"
VERSION_FILE="$PARENT/abzukg/public/version.txt"
UPDATE_URL="https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh"
LOG_LINES_KEPT=2000

latest() {
  wget -qO- "https://api.github.com/repos/$1/commits/master" \
    | grep -m1 '"sha"' | cut -d'"' -f4
}

# GitHub not reachable: try again at the next run, silently.
APP_SHA=$(latest dagosan/abzuKG || true)
TIAMAT_SHA=$(latest dagosan/tiamatLCs || true)
if [ -z "$APP_SHA" ] || [ -z "$TIAMAT_SHA" ]; then exit 0; fi
WANTED="$APP_SHA $TIAMAT_SHA"

# First run: what update.sh installed last counts as already tried.
if [ ! -f "$STATE" ] && [ -f "$VERSION_FILE" ]; then
  echo "$(sed -n 's/^master //p' "$VERSION_FILE") $(sed -n 's/^tiamat master //p' "$VERSION_FILE")" > "$STATE"
fi
if [ -f "$STATE" ] && [ "$(cat "$STATE")" = "$WANTED" ]; then exit 0; fi

# One update at a time (a build takes longer than the scheduler's interval).
if ! mkdir "$LOCK" 2>/dev/null; then exit 0; fi
trap 'rmdir "$LOCK"' EXIT

# The scheduler's PATH may lack Container Station's docker (QNAP).
if ! command -v docker >/dev/null 2>&1 && [ -x /sbin/getcfg ]; then
  STATION=$(/sbin/getcfg container-station Install_Path -f /etc/config/qpkg.conf || true)
  if [ -n "$STATION" ]; then PATH="$STATION/bin:$PATH"; export PATH; fi
fi

echo "$WANTED" > "$STATE"
{
  echo "=== $(date '+%Y-%m-%d %H:%M') updating to abzuKG ${APP_SHA%"${APP_SHA#???????}"}, tiamatLCs ${TIAMAT_SHA%"${TIAMAT_SHA#???????}"}"
  if wget -qO "$PARENT/abzukg-update.sh.tmp" "$UPDATE_URL" \
    && sh "$PARENT/abzukg-update.sh.tmp"; then
    echo "=== $(date '+%Y-%m-%d %H:%M') done"
  else
    echo "=== $(date '+%Y-%m-%d %H:%M') FAILED; the previous version keeps running. Not tried again until a new commit."
  fi
  rm -f "$PARENT/abzukg-update.sh.tmp"
} >> "$LOG" 2>&1

tail -n "$LOG_LINES_KEPT" "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
