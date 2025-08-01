setup:
	@brew install hugo
	@git submodule update --init themes/congo 
.PHONY: setup

update_themes:
	@git submodule update --remote --merge
.PHONY: update_themes

start:
	@hugo server --buildFuture
.PHONY: start