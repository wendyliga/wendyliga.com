HUGO_VERSION := $(strip $(shell cat .hugo-version 2>/dev/null))
ifeq ($(HUGO_VERSION),)
$(error .hugo-version is missing or empty; it is the single source for the expected Hugo version)
endif

setup: themes/congo/.git
	@brew install hugo
	@$(MAKE) check-hugo

themes/congo/.git:
	@git submodule update --init themes/congo

.PHONY: setup

# A missing Hugo is fatal; a version mismatch only warns, so that a routine
# `brew upgrade` cannot brick `make build` and `make start` with no way back.
check-hugo:
	@command -v hugo >/dev/null || { echo "Hugo is not installed. Run 'make setup' on macOS."; exit 1; }
	@hugo version | grep -q "hugo v$(HUGO_VERSION)" || { \
		echo "WARNING: .hugo-version expects Hugo $(HUGO_VERSION), but found:"; \
		hugo version; \
		echo "WARNING: local output may differ from the GitHub Pages build."; \
		echo "WARNING: install $(HUGO_VERSION), or update .hugo-version if the bump is intended."; \
	}
.PHONY: check-hugo

update_themes:
	@git submodule update --remote --merge
.PHONY: update_themes

start: check-hugo
	@hugo server --buildFuture --renderToMemory --baseURL http://localhost:1313/ --bind 127.0.0.1 --port 1313
.PHONY: start

build: check-hugo
	@hugo --gc --minify
.PHONY: build

# Builds into a fresh directory instead of reusing public/, which keeps pages
# from earlier builds and so hides links to pages that no longer exist.
check-links: check-hugo
	@out="$$(mktemp -d)" && trap 'rm -rf "$$out"' EXIT && \
		hugo --gc --minify --destination "$$out" && \
		python3 scripts/check-links.py "$$out"
.PHONY: check-links

# The Lint job in .github/workflows/ci.yaml. actionlint runs ShellCheck on the
# workflows' run: blocks, but skips them silently if ShellCheck is missing.
lint:
	@command -v actionlint shellcheck >/dev/null || { echo "Run 'brew install actionlint shellcheck' on macOS."; exit 1; }
	@actionlint
	@shellcheck scripts/*.sh
.PHONY: lint
