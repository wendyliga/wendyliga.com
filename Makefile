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
