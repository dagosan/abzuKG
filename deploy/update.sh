#!/bin/sh
# Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2.
#
# Installs or updates the Location Code Manager (abzuKG) on the NAS from GitHub and
# rebuilds its container.
#   wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
# Optional: a branch name as first argument (default master), and ABZUKG_DIR
# for the parent folder (default /share/Container, as on QNAP).
set -eu

REPO="dagosan/abzuKG"
BRANCH="${1:-master}"
PARENT="${ABZUKG_DIR:-/share/Container}"
APP="abzukg"

cd "$PARENT"
# The exact commit, so the image can say which version it serves.
SHA=$(wget -qO- "https://api.github.com/repos/$REPO/commits/$BRANCH" \
  | grep -m1 '"sha"' | cut -d'"' -f4)
if [ -z "$SHA" ]; then
  echo "Could not read the latest commit of $BRANCH on GitHub." >&2
  exit 1
fi

echo "Downloading $REPO $BRANCH at ${SHA%"${SHA#???????}"}…"
wget -qO "$APP.tar.gz" "https://github.com/$REPO/archive/$SHA.tar.gz"
rm -rf "$APP.new" "abzuKG-$SHA"
tar xzf "$APP.tar.gz" && rm "$APP.tar.gz"
mv "abzuKG-$SHA" "$APP.new"
# Served at /version.txt (Vite copies public/ into the build).
printf '%s %s\n' "$BRANCH" "$SHA" > "$APP.new/public/version.txt"

# Swap folders only once the download is complete; the running container
# keeps serving until the rebuild below replaces it.
rm -rf "$APP"
mv "$APP.new" "$APP"
cd "$APP"
docker compose up -d --build

echo "The Location Code Manager now serves $BRANCH at $SHA on port 8090 (see /version.txt)."
