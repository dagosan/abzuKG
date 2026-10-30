<!-- Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2.
     Modified 2026-10-30: the location code register (Tiamat + PostGIS) runs alongside. -->

# Running the Location Code Manager in Docker (e.g. on a NAS)

The app folder, image and container on the server are called `abzukg`, after
the repository; renaming them would leave an old container holding the port.

Three containers, all started by one `docker compose`:

| Container | What it is |
| --- | --- |
| `abzukg` | The app (static files and `bootstrap.json`) in nginx, port 8090. The browser fetches RINF data straight from ERA's SPARQL endpoint. Requests to `/era/…` are passed on to Tiamat, so the browser talks to one address only |
| `abzukg-tiamat` | The location code register: Tiamat from dagosan/tiamatLCs (branch `location-codes`), built from source with its `Dockerfile.era`, profile `era-location-codes`. No port of its own on the NAS |
| `abzukg-tiamat-db` | PostgreSQL 17 with PostGIS for Tiamat. Data in the Docker volume `abzukg-tiamat-db` |

| File | Purpose |
| --- | --- |
| `Dockerfile` (repo root) | Builds the app with Node 22, then copies it into nginx |
| `docker-compose.yml` (repo root) | The three containers; restart with the NAS |
| `deploy/nginx.conf` | Deep links (`/section-of-line/…`) load the app; `/era/` goes to Tiamat; caching |
| `deploy/bootstrap.json` | Default config: modern UI, ERA endpoint, map centred on Europe, register at `/era/v1/location-codes` |
| `deploy/update.sh` | Installs or updates both repositories from GitHub and rebuilds the containers |
| `/share/Container/abzukg.env` | Made by `update.sh` on first run: the database password. Keep it; the database only accepts the password it was created with |

## Install on a QNAP NAS (Container Station)

1. In QTS, turn on SSH (Control Panel → Network & File Services → Telnet/SSH),
   then from your Mac: `ssh admin@<nas-address>`.
2. Download and start it (the repositories are public, so no git is needed):

   ```sh
   wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/tiamat-location-codes/deploy/update.sh | sh
   ```

   The script downloads the latest commits of abzuKG `tiamat-location-codes`
   into `/share/Container/abzukg` and tiamatLCs `location-codes` into
   `/share/Container/tiamatlcs`, creates the database password the first time,
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

If port 8090 is taken, change the left number in `docker-compose.yml`
(`"8091:80"`).

## Update to the latest commit

Run the same command again:

```sh
wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/tiamat-location-codes/deploy/update.sh | sh
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
before `sh`. Once the two branches are merged into `master`, the defaults at
the top of `update.sh` become `master`.

## The location code register

- **Logs**: `docker logs -f abzukg-tiamat` (Tiamat), `docker logs abzukg-tiamat-db`.
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

The app has no login yet, so anyone with the link can use it, **including
the location code register**: they can submit requests and take any role.
Don't publish it with Funnel until there is a login; inside your tailnet only
your own devices reach it.

## Known limits of this setup

- "Log in" and the "Stop places" search mode need a Tiamat backend and an OIDC
  login, which this config doesn't set up. The RINF features don't need them.
- If you keep your own `bootstrap.json` (above), add
  `"locationCodesApiUrl": "/era/v1/location-codes"` to it; without that line
  the app keeps location codes in each visitor's browser instead of Tiamat.
- Roles in the register are picked with the "Acting as" switch, not from a
  login; Tiamat applies its rules to the name and role the page sends.
- Map tiles come from openstreetmap.org; for heavier use, set a tile server of
  your own in `mapConfig.baseLayers`.
