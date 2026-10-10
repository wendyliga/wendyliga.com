#!/usr/bin/env python3
"""Check that internal links and assets in a built site resolve to a file.

Hugo validates page resources and `ref` shortcodes, but not plain Markdown
links or raw HTML. This reads every .html file in the output directory and
checks each internal href, src and srcset URL against the files in it. A URL
is internal when it is relative or lives under the site's baseURL. External
URLs are never fetched, and #fragments are not checked.

Run it on a fresh build (`make check-links`): a reused public/ still holds
pages from earlier builds, which hides links to pages that no longer exist.
"""

import argparse
import os
import re
import sys
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlsplit

CONFIG = Path(__file__).resolve().parent.parent / "config/_default/config.toml"
MAX_PAGES_SHOWN = 5


class ReferenceParser(HTMLParser):
    """Collects (attribute, URL) pairs from href, src and srcset.

    A real parser, not a regex: the minifier drops the quotes around most
    attribute values, and <script> and <style> bodies must not be scanned.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if not value:
                continue
            if name in ("href", "src"):
                self.references.append((name, value.strip()))
            elif name == "srcset":
                # Comma-separated "URL [descriptor]" candidates. URLs that
                # contain a comma themselves are not supported.
                for candidate in value.split(","):
                    fields = candidate.split()
                    if fields:
                        self.references.append((name, fields[0]))


def read_base_url():
    config = CONFIG.read_text(encoding="utf-8")
    match = re.search(r"""^\s*baseURL\s*=\s*["']([^"']+)["']""", config, re.MULTILINE)
    if not match:
        sys.exit(f"error: no baseURL in {CONFIG}; pass --base-url")
    return match.group(1)


def site_path(url, page_url, base):
    """Return the path of `url` inside the site, or None if it is not checked.

    Not checked: other hosts, other schemes (mailto:, data:, ...), same-host
    URLs outside the baseURL, and bare #fragments, which stay on the page.
    """
    if not url or url.startswith("#"):
        return None
    target = urlsplit(urljoin(page_url, url))
    if target.scheme not in ("http", "https") or target.netloc.lower() != base.netloc.lower():
        return None
    path = unquote(target.path) or "/"
    if not path.startswith(base.path):
        return None
    return path[len(base.path) :]


def resolves(path, files):
    """Whether the output holds a file to serve for `path`."""
    if path == "" or path.endswith("/"):
        return path + "index.html" in files
    # A directory linked without its trailing slash is redirected to it.
    return path in files or path + "/index.html" in files


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("output", nargs="?", default="public", help="built site (default: public)")
    parser.add_argument("--base-url", help=f"the build's baseURL (default: from {CONFIG.name})")
    args = parser.parse_args()

    base_url = (args.base_url or read_base_url()).rstrip("/") + "/"
    base = urlsplit(base_url)

    files = set()
    for directory, _, names in os.walk(args.output):
        for name in names:
            files.add(Path(directory, name).relative_to(args.output).as_posix())
    pages = sorted(name for name in files if name.endswith(".html"))
    if not pages:
        sys.exit(f"error: no HTML pages in {args.output}; build the site first")

    # Looking paths up in `files` instead of on disk keeps the check
    # case-sensitive on macOS, as it is on the Linux hosts that serve the site.
    checked = 0
    broken = defaultdict(list)
    for page in pages:
        html = ReferenceParser()
        html.feed(Path(args.output, page).read_text(encoding="utf-8"))
        html.close()
        for attribute, url in html.references:
            try:
                path = site_path(url, base_url + quote(page), base)
            except ValueError:
                broken["(malformed URL)"].append(f'{page}: {attribute}="{url}"')
                continue
            if path is None:
                continue
            checked += 1
            if not resolves(path, files):
                broken["/" + path].append(f'{page}: {attribute}="{url}"')

    for missing, uses in sorted(broken.items()):
        print(f"BROKEN {missing}")
        for use in uses[:MAX_PAGES_SHOWN]:
            print(f"  {use}")
        if len(uses) > MAX_PAGES_SHOWN:
            print(f"  ... and {len(uses) - MAX_PAGES_SHOWN} more")
    print(
        f"{len(pages)} pages, {checked} internal references, "
        f"{sum(map(len, broken.values()))} broken"
    )
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
