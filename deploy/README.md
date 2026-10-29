<!-- Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2. -->

# Running abzuKG in Docker (e.g. on a NAS)

The app is a set of static files plus a runtime config, `bootstrap.json`. The
browser fetches RINF data straight from ERA's SPARQL endpoint, so the server
only serves files: one small nginx container, no database, no backend.

| File | Purpose |
| --- | --- |
| `Dockerfile` (repo root) | Builds the app with Node 22, then copies it into nginx |
| `docker-compose.yml` (repo root) | Runs it on port 8090, restarts with the NAS |
| `deploy/nginx.conf` | Deep links (`/section-of-line/…`) load the app; caching |
| `deploy/bootstrap.json` | Default config: modern UI, ERA endpoint, map centred on Europe |

## Install on a QNAP NAS (Container Station)

1. In QTS, turn on SSH (Control Panel → Network & File Services → Telnet/SSH),
   then from your Mac: `ssh admin@<nas-address>`.
2. Download the branch and start it (the repository is public, so no git is needed):

   ```sh
   cd /share/Container
   wget -O abzukg.tar.gz https://github.com/dagosan/abzuKG/archive/refs/heads/rinf-operational-points.tar.gz
   tar xzf abzukg.tar.gz && rm abzukg.tar.gz
   mv abzuKG-rinf-operational-points abzukg && cd abzukg
   docker compose up -d --build
   ```

   The first build takes a few minutes (npm install). The container then shows
   up in Container Station as `abzukg`.
3. Open `http://<nas-address>:8090`, or `http://ts464:8090` from any device on
   your tailnet.

If port 8090 is taken, change the left number in `docker-compose.yml`
(`"8091:80"`).

## Update to the latest commit

```sh
cd /share/Container && rm -rf abzukg
wget -O abzukg.tar.gz https://github.com/dagosan/abzuKG/archive/refs/heads/rinf-operational-points.tar.gz
tar xzf abzukg.tar.gz && rm abzukg.tar.gz
mv abzuKG-rinf-operational-points abzukg && cd abzukg
docker compose up -d --build
```

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
- Map tiles come from openstreetmap.org; for heavier use, set a tile server of
  your own in `mapConfig.baseLayers`.
