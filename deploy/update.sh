#!/bin/sh
# Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2.
# Modified 2026-10-30: also installs the location code register (Tiamat + PostGIS);
# both repositories from master; the app's port from ABZUKG_PORT in abzukg.env.
# Modified 2026-11-01: the login service (Keycloak): its passwords, the app's
# https address (LCM_PUBLIC_URL) and the realm's addresses.
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

# Passwords, made once and kept outside the app folders (abzukg.env). The
# databases only accept the password they were created with, so never change
# one here without changing it in its database too.
if [ ! -f "$ENV_FILE" ]; then
  : > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi
add_password() {
  if ! grep -q "^$1=" "$ENV_FILE"; then
    printf '%s=%s\n' "$1" "$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)" >> "$ENV_FILE"
    echo "Added a new $1 to $ENV_FILE."
  fi
}
add_password TIAMAT_DB_PASSWORD
add_password KEYCLOAK_DB_PASSWORD
add_password KEYCLOAK_ADMIN_PASSWORD

# The https address people open the app at. Logging in only works over https,
# and the login service writes this address into its pages and tokens.
PUBLIC_URL=$(sed -n 's/^LCM_PUBLIC_URL=//p' "$ENV_FILE")
case "$PUBLIC_URL" in
  https://*[!/]) ;;
  *)
    echo "Set the app's https address in $ENV_FILE, without a final /, e.g.:" >&2
    echo "  echo LCM_PUBLIC_URL=https://ts464.taile5a20b.ts.net:8443 >> $ENV_FILE" >&2
    echo "then run this script again (see deploy/README.md, Login)." >&2
    exit 1
    ;;
esac

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

# The realm's address for the app's login (used the first time Keycloak
# starts; later, change it in the admin console: Clients → location-code-manager).
sed -i "s#__LCM_PUBLIC_URL__#$PUBLIC_URL#g" "$APP/deploy/keycloak/era-realm.json"

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

# Keycloak takes a minute to start (longer the first time, as it sets up its
# database and imports the realm).
echo "Waiting for the login service…"
tries=0
until wget -qO /dev/null "http://localhost:$PORT/auth/realms/era/.well-known/openid-configuration"; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "The login service did not answer within 5 minutes. Its log:" >&2
    docker logs --tail 60 abzukg-keycloak >&2
    exit 1
  fi
  sleep 5
done

echo "The Location Code Manager serves $BRANCH at $SHA on port $PORT,"
echo "with the register from tiamatLCs $TIAMAT_BRANCH at $TIAMAT_SHA (see /version.txt)."
echo "Open it at $PUBLIC_URL; accounts and roles: $PUBLIC_URL/auth/admin (user admin,"
echo "password KEYCLOAK_ADMIN_PASSWORD in $ENV_FILE)."
