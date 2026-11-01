<!-- Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2.
     Modified 2026-10-30: the location code register (Tiamat + PostGIS) runs alongside;
     the app's port is a setting (ABZUKG_PORT).
     Modified 2026-11-01: a login (Keycloak) for location code requests and steps. -->

# Running the Location Code Manager in Docker (e.g. on a NAS)

The app folder, image and container on the server are called `abzukg`, after
the repository; renaming them would leave an old container holding the port.

Five containers, all started by one `docker compose`:

| Container | What it is |
| --- | --- |
| `abzukg` | The app (static files and `bootstrap.json`) in nginx, port 8090 (or `ABZUKG_PORT`). The browser fetches RINF data straight from ERA's SPARQL endpoint. Requests to `/era/…` are passed on to Tiamat and `/auth/…` to Keycloak, so the browser talks to one address only |
| `abzukg-tiamat` | The location code register: Tiamat from dagosan/tiamatLCs (`master`), built from source with its `Dockerfile.era`, profile `era-location-codes`. No port of its own on the NAS |
| `abzukg-tiamat-db` | PostgreSQL 17 with PostGIS for Tiamat. Data in the Docker volume `abzukg-tiamat-db` |
| `abzukg-keycloak` | The login service (Keycloak 26, Apache 2.0 licence), realm `era`: the accounts and their roles in the location code workflow |
| `abzukg-keycloak-db` | PostgreSQL 17 for Keycloak. Data in the Docker volume `abzukg-keycloak-db` |

| File | Purpose |
| --- | --- |
| `Dockerfile` (repo root) | Builds the app with Node 22, then copies it into nginx |
| `docker-compose.yml` (repo root) | The five containers; restart with the NAS |
| `deploy/nginx.conf` | Deep links (`/section-of-line/…`) load the app; `/era/` goes to Tiamat, `/auth/` to Keycloak; caching |
| `deploy/bootstrap.json` | Default config: modern UI, ERA theme, ERA endpoint, map centred on Belgium at zoom 8 (where RINF data shows), register at `/era/v1/location-codes`, login at `/auth/realms/era` |
| `deploy/keycloak/era-realm.json` | The realm Keycloak imports the first time it starts: the five workflow roles (new accounts get *requester*), the app as a client, and the `lcm_roles` claim that carries an account's roles |
| `deploy/update.sh` | Installs or updates both repositories from GitHub and rebuilds the containers |
| `/share/Container/abzukg.env` | Made by `update.sh` on first run: the passwords of both databases and of Keycloak's `admin`, the app's https address `LCM_PUBLIC_URL` (you add it, see Login), and optionally `ABZUKG_PORT`. Keep it; each database only accepts the password it was created with |

## Install on a QNAP NAS (Container Station)

1. In QTS, turn on SSH (Control Panel → Network & File Services → Telnet/SSH),
   then from your Mac: `ssh admin@<nas-address>`.
2. Download and start it (the repositories are public, so no git is needed):

   ```sh
   wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
   ```

   The script downloads the latest commits of `master` of abzuKG into
   `/share/Container/abzukg` and of tiamatLCs into `/share/Container/tiamatlcs`, creates the database password the first time,
   and runs `docker compose up -d --build`. The first build takes 10–20
   minutes (Maven downloads Tiamat's libraries, npm the app's). It then waits
   until the register answers, or prints Tiamat's log if it doesn't within 5
   minutes. The containers show up in Container Station as an application
   `abzukg`.
3. Open `http://<nas-address>:8090`, or `http://ts464:8090` from any device on
   your tailnet. In the Location codes tab, the ⋮ menu says the data is kept
   in Tiamat.
4. If you used the app before, requests made then are in your browser only:
   download a backup from the ⋮ menu *before* the update (the browser store
   is not shown once Tiamat is configured) and restore it afterwards into
   Tiamat.

If port 8090 is taken by another app, choose another port
in the password file and run `update.sh` again:

```sh
echo ABZUKG_PORT=8095 >> /share/Container/abzukg.env
```

Every `:8090` below is then that port.

## Login

Submitting a request, amending one, and every step of the Agency need a
login; the map, the search, the RINF reports and the register of codes stay
open to anyone who reaches the app. An account's roles decide what it can
do; someone with several roles switches between those only.

Browsers allow the login only over https, so the app needs an https address
first. Inside your tailnet, `tailscale serve` gives it one (in the Tailscale
admin console, DNS → turn on MagicDNS and HTTPS certificates once):

```sh
docker exec <tailscale-container> tailscale serve status
docker exec <tailscale-container> tailscale serve --bg --https=8443 http://127.0.0.1:8090
docker exec <tailscale-container> tailscale serve status
```

- `<tailscale-container>` is the name `docker ps` shows (e.g. `tailscale-tailscale-1`);
  `127.0.0.1` reaches the app because that container shares the NAS's network.
  If Tailscale is the QNAP app instead, run its `tailscale` with `sudo` and the
  full path (`find / -name tailscale -type f 2>/dev/null`).
- With `ABZUKG_PORT` set, use that port instead of 8090.
- Check `status` first: if another app is already served (e.g. on 443, with
  Funnel), leave it as it is. Each port is set separately, so adding 8443
  doesn't change it; pick another port if 8443 is taken. Never run
  `tailscale serve reset`, which removes every entry.
- Afterwards `status` should show `:8443 (tailnet only)`, not "Funnel on".

The app is then at `https://ts464.<tailnet>.ts.net:8443` (the address
`tailscale serve status` shows), reachable from your own devices only.
Tell the install that address, without a final `/`, then run `update.sh`:

```sh
echo LCM_PUBLIC_URL=https://ts464.taile5a20b.ts.net:8443 >> /share/Container/abzukg.env
```

```sh
wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
```

`update.sh` adds Keycloak's passwords to `abzukg.env` (existing ones are
kept) and waits until the login service answers too.

**Accounts.** Open `<LCM_PUBLIC_URL>/auth/admin`, log in as `admin` with
`KEYCLOAK_ADMIN_PASSWORD` from `/share/Container/abzukg.env`, and switch to
the realm **era** (top left). Then, for each person:

1. Users → Add user: username, e-mail, **first and last name** (the name the
   register records with each step), then Create.
2. Credentials → Set password (leave *Temporary* on, so they choose their own
   at first login).
3. Role mapping → Assign role → Filter by realm roles: pick their roles
   (`codeAdministrator`, `rinfCorrespondent`, `externalCoordinationPoint`,
   `validatingOfficer`). Every new account is already a `requester`; for
   Agency staff who shouldn't file requests, remove `default-roles-era`.

There is no self-registration and no "forgot password" (the NAS sends no
e-mail): you set and reset passwords in the admin console.

The Agency's four-eyes rule needs two different accounts: the code
administrator and the validating officer of one request must be different
people.

Good to know:

- Tiamat takes the name and roles from the login itself, so a page cannot
  act for someone else. Without a valid login, Tiamat answers 401; with a
  role the account doesn't hold, 403.
- Requests and their history are readable only with a login, but for now
  any logged-in account can read every request through the API; the page
  shows a requester only their own.
- If the https address changes, update `LCM_PUBLIC_URL`, and in the admin
  console Clients → `location-code-manager` change *Root URL* and *Valid
  redirect URIs* (`<address>/*`): the realm file is read only the first time.
- Logging in from `http://<nas-address>:8090` doesn't work (no https); the
  rest of the app does.

## Update to the latest commit

Run the same command again:

```sh
wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
```

It replaces both source folders with the latest commits and rebuilds; the
old containers keep serving until the new ones are ready. The register's
database (a Docker volume), the password file and your own config (below)
live outside those folders, so they survive. Tiamat's later builds are as
slow as the first (no cache between downloads).

To check which version is running, open `http://<nas-address>:8090/version.txt`:
it shows the branches and commits of the app and of Tiamat, to compare with
the latest commits on GitHub.

To try other branches, add their names: `… | sh -s <abzuKG branch> <tiamatLCs
branch>`. For a parent folder other than `/share/Container`, set `ABZUKG_DIR`
before `sh`.

## The location code register

- **Logs**: `docker logs -f abzukg-tiamat` (Tiamat), `docker logs abzukg-tiamat-db`,
  `docker logs -f abzukg-keycloak` (login).
- **Is it up?** `http://<nas-address>:8090/era/v1/location-codes/codes` returns
  the register as JSON (`[]` when empty); 502 means Tiamat isn't running.
- **Backup**: the ⋮ menu's backup in the Location codes tab downloads the whole
  register. A database dump as well:
  `docker exec abzukg-tiamat-db pg_dump -U tiamat tiamat | gzip > /share/Container/tiamat-$(date +%F).sql.gz`
- **Restart only Tiamat**: `cd /share/Container/abzukg && docker compose --env-file ../abzukg.env restart tiamat`.
- **Start again from an empty register** (deletes every request and code):
  `docker compose --env-file ../abzukg.env down`, then
  `docker volume rm abzukg-tiamat-db`, then run `update.sh` again.
- Tiamat checks new codes against ERA's Knowledge Graph, so the NAS needs
  internet access; if the KG doesn't answer, a step is refused with
  "knowledge graph unavailable" and nothing is saved.

## Change the config without rebuilding

Keep your own copy outside the app folder, so updates don't overwrite it:

```sh
cp /share/Container/abzukg/deploy/bootstrap.json /share/Container/abzukg-bootstrap.json
```

Then, in `docker-compose.yml`, uncomment the `volumes:` lines and point them at
`/share/Container/abzukg-bootstrap.json`. Edits apply on the next page reload.

## Optional: public HTTPS link via Tailscale Funnel

Funnel only accepts ports 443, 8443 and 10000. To publish the app on 8443:

```sh
docker exec <tailscale-container> tailscale funnel --bg --https=8443 http://127.0.0.1:8090
```

Funnel makes the app, and Keycloak's login page and admin console at
`/auth/`, reachable from the internet. Requests and steps need an account,
but the admin console is then only as safe as the `admin` password: prefer
`tailscale serve` (above), which keeps everything inside your tailnet. With
Funnel, `LCM_PUBLIC_URL` is the Funnel address.

## Known limits of this setup

- The "Stop places" search mode needs Entur's Tiamat backend, which this
  config doesn't set up. The RINF features don't need it.
- If you keep your own `bootstrap.json` (above), copy into it the lines of
  `deploy/bootstrap.json` it lacks: `locationCodesApiUrl`, `themeConfigs`,
  and for the login `locationCodesLoginRequired`, `oidcConfig`,
  `claimsNamespace` and `preferredNameNamespace`. Without the login lines,
  the page shows the "Acting as" switch with every role, while Tiamat
  refuses every request and step without a login.
- Map tiles come from openstreetmap.org; for heavier use, set a tile server of
  your own in `mapConfig.baseLayers`.
