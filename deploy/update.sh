#!/bin/sh
# Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2.
# Modified 2026-10-30: also installs the location code register (Tiamat + PostGIS);
# both repositories from master; the app's port from ABZUKG_PORT in abzukg.env.
#
# Installs or updates the Location Code Manager (abzuKG) and its location code
# register (Tiamat, dagosan/tiamatLCs) on the NAS from GitHub, and rebuilds
# the containers. The register's database is a Docker volume: updates keep it.
#
#   wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
#
# Optional: the abzuKG branch as first argument and the Tiamat branch as second
# (default master for both), and ABZUKG_DIR for the parent folder (default
# /share/Container, as on QNAP).
set -eu

BRANCH="${1:-master}"
TIAMAT_BRANCH="${2:-master}"
PARENT="${ABZUKG_DIR:-/share/Container}"
APP="abzukg"
TIAMAT_DIR="tiamatlcs"
ENV_FILE="$PARENT/abzukg.env"

# Downloads the latest commit of a GitHub branch into a folder, replacing it
# only once the download is complete. Prints the commit.
download() {
  repo="$1" branch="$2" folder="$3"
  sha=$(wget -qO- "https://api.github.com/repos/$repo/commits/$branch" \
    | grep -m1 '"sha"' | cut -d'"' -f4)
  if [ -z "$sha" ]; then
    echo "Could not read the latest commit of $repo $branch on GitHub." >&2
    exit 1
  fi
  echo "Downloading $repo $branch at ${sha%"${sha#???????}"}…" >&2
  wget -qO "$folder.tar.gz" "https://github.com/$repo/archive/$sha.tar.gz"
  rm -rf "$folder.new" "${repo#*/}-$sha"
  tar xzf "$folder.tar.gz" && rm "$folder.tar.gz"
  mv "${repo#*/}-$sha" "$folder.new"
  echo "$sha"
}

cd "$PARENT"

# The database password, made once and kept outside the app folders. The
# database only accepts the password it was created with, so never change it
# here without changing it in the database too.
if [ ! -f "$ENV_FILE" ]; then
  password=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)
  printf 'TIAMAT_DB_PASSWORD=%s\n' "$password" > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE with a new database password."
fi

# The app's port on the NAS (ABZUKG_PORT in the same file, default 8090).
PORT=$(sed -n 's/^ABZUKG_PORT=//p' "$ENV_FILE")
PORT="${PORT:-8090}"

SHA=$(download dagosan/abzuKG "$BRANCH" "$APP")
TIAMAT_SHA=$(download dagosan/tiamatLCs "$TIAMAT_BRANCH" "$TIAMAT_DIR")

# Served at /version.txt (Vite copies public/ into the build).
printf '%s %s\ntiamat %s %s\n' "$BRANCH" "$SHA" "$TIAMAT_BRANCH" "$TIAMAT_SHA" \
  > "$APP.new/public/version.txt"

# Swap folders; the running containers keep serving until the rebuild below
# replaces them.
rm -rf "$APP" "$TIAMAT_DIR"
mv "$APP.new" "$APP"
mv "$TIAMAT_DIR.new" "$TIAMAT_DIR"

cd "$APP"
echo "Building (the first Tiamat build downloads its libraries and takes 10–20 minutes)…"
docker compose --env-file "$ENV_FILE" up -d --build

# Tiamat needs a minute or two to start (and to create its tables the first time).
echo "Waiting for the location code register…"
tries=0
until wget -qO /dev/null "http://localhost:$PORT/era/v1/location-codes/codes"; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "The register did not answer within 5 minutes. Its log:" >&2
    docker logs --tail 60 abzukg-tiamat >&2
    exit 1
  fi
  sleep 5
done

echo "The Location Code Manager serves $BRANCH at $SHA on port $PORT,"
echo "with the register from tiamatLCs $TIAMAT_BRANCH at $TIAMAT_SHA (see /version.txt)."
