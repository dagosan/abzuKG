# Added for the ERA RINF frontend, 2026-10-29. Licensed under the EUPL 1.2.
# Builds abzuKG into static files and serves them with nginx.
#
#   docker build -t abzukg .
#   docker run -d -p 8090:80 abzukg

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# --ignore-scripts skips husky (git hooks), which is not needed in an image.
RUN npm ci --ignore-scripts
COPY . .
RUN npx vite build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
# Default runtime config. Override by mounting your own file over this path.
COPY deploy/bootstrap.json /usr/share/nginx/html/bootstrap.json
EXPOSE 80
