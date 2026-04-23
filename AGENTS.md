# Repository Guidelines

## Project Structure & Module Organization
- `content/` is the main source tree. Use `content/blog/<slug>/index.md` for blog page bundles, and keep post images in the same bundle (usually `images/`).
- Chinese story entries follow `content/chinese/<year>/<month>/<day>/<uuid>.md` with media in the matching folder (`<uuid>/audio.mp3`, `<uuid>/thumbnail.png`).
- `layouts/shortcodes/` contains custom Hugo shortcodes (for example `audio`, `answers`, `youtube-music`).
- `config/_default/*.toml` holds site configuration. The theme is a Git submodule at `themes/congo`.
- `static/` ships files as-is; `assets/` is for Hugo-processed assets.

## Build, Test, and Development Commands
- `make setup`: install Hugo and initialize the theme submodule.
- `make start`: start local dev server with future posts enabled (`hugo server --buildFuture`), default URL `http://localhost:1313`.
- `hugo --gc --minify`: run a production-style build (matches CI build intent) and catch template/content errors.
- `make update_themes`: update theme submodules to latest remote commits.

## Coding Style & Naming Conventions
- Write content in Markdown with YAML front matter (`---`) and lowercase keys.
- Set `draft: false` only when content is ready to publish.
- Use lowercase, hyphenated slugs for blog folders (example: `content/blog/pihole-doh-cloudflare/`).
- For Chinese content, preserve the dated path + UUID pattern; keep media filenames stable (`audio.mp3`, `thumbnail.png`).
- Reuse existing shortcode patterns instead of introducing new markup styles for similar blocks.

## Testing Guidelines
- There is no separate unit-test suite in this repo; verification is build + manual page checks.
- Before opening a PR, run `hugo --gc --minify` and ensure it exits cleanly.
- Preview with `make start` and validate changed pages: images load, shortcodes render, and audio embeds play.

## Commit & Pull Request Guidelines
- Follow the repository’s concise commit style seen in history: action-first subjects such as `new story: ...`, `thumbnail: ...`, `update audio: ...`.
- Keep commits atomic where possible (content text, thumbnail updates, audio updates can be split while iterating).
- PRs should include a short summary, the main changed paths, and screenshots when layouts/theme/config changes affect rendering.
- Link related issues when applicable and call out any submodule updates.
