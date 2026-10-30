<!-- Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2. -->

# Running the Location Code Manager in Docker (e.g. on a NAS)

The app folder, image and container on the server are called `abzukg`, after
the repository; renaming them would leave an old container holding the port.

The app is a set of static files plus a runtime config, `bootstrap.json`. The
browser fetches RINF data straight from ERA's SPARQL endpoint, so the server
only serves files: one small nginx container, no database, no backend.

| File | Purpose |
| --- | --- |
| `Dockerfile` (repo root) | Builds the app with Node 22, then copies it into nginx |
| `docker-compose.yml` (repo root) | Runs it on port 8090, restarts with the NAS |
| `deploy/nginx.conf` | Deep links (`/section-of-line/…`) load the app; caching |
| `deploy/bootstrap.json` | Default config: modern UI, ERA endpoint, map centred on Europe |
| `deploy/update.sh` | Installs or updates from GitHub (`master`) and rebuilds the container |

## Install on a QNAP NAS (Container Station)

1. In QTS, turn on SSH (Control Panel → Network & File Services → Telnet/SSH),
   then from your Mac: `ssh admin@<nas-address>`.
2. Download `master` and start it (the repository is public, so no git is needed):

   ```sh
   wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
   ```

   The script downloads the latest commit of `master` into
   `/share/Container/abzukg` and runs `docker compose up -d --build`. The first
   build takes a few minutes (npm install). The container then shows up in
   Container Station as `abzukg`.
3. Open `http://<nas-address>:8090`, or `http://ts464:8090` from any device on
   your tailnet.

If port 8090 is taken, change the left number in `docker-compose.yml`
(`"8091:80"`).

## Update to the latest commit

Run the same command again:

```sh
wget -qO- https://raw.githubusercontent.com/dagosan/abzuKG/master/deploy/update.sh | sh
```

It replaces the app folder with the latest `master` and rebuilds; the old
container keeps serving until the new one is ready. Your own config (below)
lives outside that folder, so it survives.

To check which version is running, open `http://<nas-address>:8090/version.txt`:
it shows the branch and the commit it was built from, to compare with the
latest commit on GitHub.

To try another branch, add its name: `… | sh -s some-branch`. For a parent
folder other than `/share/Container`, set `ABZUKG_DIR` before `sh`.

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

The app has no login of its own, so anyone with the link can use it. It is
read-only and shows public RINF data.

## Known limits of this setup

- "Log in" and the "Stop places" search mode need a Tiamat backend and an OIDC
  login, which this config doesn't set up. The RINF features don't need them.
- Location code requests are kept in each visitor's browser. To keep them in
  one shared register, run the Tiamat fork (dagosan/tiamatLCs, profile
  `era-location-codes`) and add `"locationCodesApiUrl":
  "http://<tiamat-host>:<port>/era/v1/location-codes"` to your
  `bootstrap.json`.
- Map tiles come from openstreetmap.org; for heavier use, set a tile server of
  your own in `mapConfig.baseLayers`.
