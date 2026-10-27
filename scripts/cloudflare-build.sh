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

# CF_PAGES_URL is the deployment's own URL, which Cloudflare Access protects.
# Previews use it so their links stay on the preview. Production keeps the
# baseURL in config/_default/config.toml: built with CF_PAGES_URL, every page
# on wendyliga.com would load its CSS and JS from behind the Access login.
if [[ -n "${CF_PAGES_URL:-}" && "${CF_PAGES_BRANCH:-}" != main ]]; then
  "$bin/hugo" --gc --minify --baseURL "$CF_PAGES_URL"
else
  "$bin/hugo" --gc --minify
fi
