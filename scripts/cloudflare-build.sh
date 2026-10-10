#!/usr/bin/env bash
# Cloudflare Pages build. Pages does not read .hugo-version, so this installs
# the pinned Hugo itself and keeps that file the single version source.
set -euo pipefail

cd "$(dirname "$0")/.."

test -f .hugo-version || { echo ".hugo-version is missing" >&2; exit 1; }
version="$(tr -d '[:space:]' < .hugo-version)"
test -n "$version" || { echo ".hugo-version is empty" >&2; exit 1; }

bin="$(mktemp -d)"
curl -fsSL "https://github.com/gohugoio/hugo/releases/download/v${version}/hugo_extended_${version}_linux-amd64.tar.gz" \
  | tar -xz -C "$bin" hugo

# CF_PAGES_URL is the deployment's own URL. Without it, absolute links would
# point at the baseURL in config/_default/config.toml.
"$bin/hugo" --gc --minify ${CF_PAGES_URL:+--baseURL "$CF_PAGES_URL"}
