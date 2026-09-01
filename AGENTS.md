# Repository Guidelines

## Project Structure & Module Organization
- `content/` is the main source tree. Use `content/blog/<slug>/index.md` for blog page bundles, and keep post images in the same bundle (usually `images/`).
- Chinese story entries follow `content/chinese/<year>/<month>/<day>/<uuid>.md` with media in the matching folder (`<uuid>/audio.mp3`, `<uuid>/thumbnail.png`).
- `layouts/shortcodes/` contains custom Hugo shortcodes (for example `audio`, `answers`, `youtube-music`).
- `config/_default/*.toml` holds site configuration. The theme is a Git submodule at `themes/congo`.
- `static/` ships files as-is; `assets/` is for Hugo-processed assets.

## Theme Reference
- This site uses the Congo Hugo theme. Use https://jpanther.github.io/congo/ as the reference for supported Congo formatting, front matter, shortcodes, layout options, and theme conventions before adding new presentation patterns.
- Prefer existing local patterns first, then Congo-supported patterns from the docs when the repo does not already show the needed format.

## Custom UI With Shortcodes
- Hugo supports custom views and reusable UI through shortcodes in `layouts/shortcodes/`. Prefer existing shortcodes over raw HTML in Markdown when a post needs embedded media, revealable answers, or link cards.
- `audio`: embeds a page-bundle MP3 with an HTML audio player. Use `src` for the media filename/path relative to the current page bundle, optional `caption`, optional `class`, and optional `preload` (defaults to `metadata`).
- `answers`: creates a collapsible answer block with `<details>`. Use optional `title` for the summary text; the inner Markdown becomes the hidden answer content.
- `youtube-music`: renders a YouTube/playlist-style card. Use `title`, `image`, and `link`; the shortcode derives and displays the link domain.
- `link-preview`: renders a generic link preview card. Use `title`, `link`, optional `image`, and optional `description`; the shortcode derives and displays the link domain.

## Congo Native Shortcodes
- Before adding a new custom shortcode or raw HTML, check `themes/congo/layouts/_shortcodes/` — Congo ships several that already cover common post-formatting needs:
  - `{{< figure src="..." alt="..." caption="..." attr="..." attrlink="..." >}}`: preferred over raw `![]()` Markdown images for any image inside a page bundle. Gives responsive/webp/lazy-loaded output via Congo's picture pipeline plus a visible caption. Use `attr` (Markdown-rendered) and optional `attrlink` for photo credit/attribution instead of stuffing it into the image `title` attribute or a manual footer paragraph.
  - `{{< lead >}}...{{< /lead >}}`: styles a paragraph as a larger "lede". Use once, right after the hero image, wrapping the post's opening/summary paragraph.
  - `{{< alert >}}...{{< /alert >}}`: callout box with a warning icon. Reserve for gotchas or easy-to-miss caveats, not routine notes — overusing it dilutes the signal.
  - `{{< badge >}}...{{< /badge >}}`: inline pill/badge styling for short labels.
  - Also available if a post needs them: `button`, `chart`, `gist`, `icon`, `katex`, `mermaid`, `profile`, `screenshot`.

## Post Formatting & Emphasis
- Use **bold**, *italic*, and underline to help readers scan and grasp a section quickly — apply them deliberately, not decoratively. A post with emphasis on every line is as hard to scan as one with none.
  - **Bold**: at most one key phrase per paragraph, marking that paragraph's takeaway or thesis. Skip paragraphs that don't need it — bullet lists with their own bold labels, transitional sentences, and agenda/scope lines usually don't.
  - *Italic*: personal asides/opinions, a contrasting phrase, or a short closing line that caps a section with a maxim-like summary.
  - Underline: Markdown has no native syntax for it; use raw `<u>...</u>` HTML (allowed since `goldmark.renderer.unsafe = true` in `config/_default/markup.toml`). Reserve for at most one sentence in the entire post — the single most load-bearing definition or fact a reader must not miss.
  - Don't stack bold, italic, and underline on the same phrase — pick one emphasis per point.

## Build, Test, and Development Commands
- `.hugo-version` is the single Hugo version source for local development and the Linux GitHub Pages workflow.
- `make setup`: on macOS, install Hugo with Homebrew, initialize the Congo submodule, and verify the installed version.
- `make check-hugo`: compare the installed Hugo against `.hugo-version` before debugging build or rendering differences. A mismatch warns but does not block, so a Homebrew upgrade cannot strand `make build`; a missing Hugo, or a missing `.hugo-version`, is fatal.
- `make start`: start the local development server with future posts enabled, default URL `http://localhost:1313`.
- `make build`: run `hugo --gc --minify`, matching the production build intent and catching template/content errors.
- `make update_themes`: update theme submodules to latest remote commits.

## Website Debugging Workflow
- Start with `make check-hugo`, then `git submodule status themes/congo`. Version or submodule drift can look like a template, shortcode, or asset bug.
- Run `make start` from the repository root and reproduce at `http://localhost:1313`. If that port is occupied, inspect it with `lsof -nP -iTCP:1313 -sTCP:LISTEN`; stop the known older server and start a fresh one instead of debugging two builds.
- Hugo normally live-reloads, but restart `make start` and hard-refresh the browser after adding or moving files under `layouts/`, `assets/`, or the theme submodule. A page can contain fresh Markdown while still displaying a stale generated JavaScript or CSS bundle.
- Never debug by editing `public/`; it is generated output. Fix the source under `content/`, `layouts/`, `assets/`, `static/`, or `config/`, then rebuild.
- Run `make build` before and after a fix. Treat Hugo errors as the first source of truth for missing page resources, malformed timing JSON, shortcode validation failures, or incompatible templates.
- In the browser, check the console and network requests for missing audio, images, or hashed assets. Confirm the changed page as well as one unrelated page so scoped assets and shortcodes do not regress the rest of the site.

### Read-Along Debugging
- Use the pilot page at `/chinese/2026/8/15/2452d37f-6b9c-4a03-a3af-a034d33e8fb5/` for synchronized transcript checks.
- The root element is `[data-read-along]`. Successful JavaScript initialization adds `.read-along--ready`, reveals `[data-audio-aids]`, and moves `.read-along__toggles` into the player; if they are absent, verify that the hashed `read-along` JavaScript asset loaded and that `data-audio-id` matches the rendered `<audio id>`.
- Timing and learning-aid data lives beside the story media in `sentence-timings.json`. Each non-empty shortcode source line is one sentence, and the JSON entry count must match it. Starts must be non-negative and strictly increasing; `make build` validates these rules.
- The `read-along` `audio` parameter must match an `id` set on the page's `{{< audio >}}` call (the pilot uses `story-audio`). `make build` fails if it does not, because the two are only wired together at runtime and a mismatch would otherwise degrade silently to plain text.
- The docked mobile player is a read-along affordance: `audio-player.js` only adds `has-story-audio-player` to `<body>` on pages that also contain a `[data-read-along]`. Story pages with a plain `{{< audio >}}` keep the inline card at every width.
- The `read-along-aids` session cookie stores `both`, `pinyin`, `english`, or `none` with `Path=/`. Remove that cookie when testing first-visit defaults; otherwise reloads should preserve the selected buttons.
- Test play, pause, seeking, ended state, mouse hover, sentence click, Enter/Space activation, and a long wrapped sentence. The tooltip should follow the active or focused sentence without changing paragraph height.
- Check desktop and a 390×844 mobile viewport in light and dark appearances. Verify that the player chips wrap, the tooltip stays inside the content column, both aid rows wrap, and neither the component nor page gains horizontal scrolling.

## Coding Style & Naming Conventions
- Write content in Markdown with YAML front matter (`---`) and lowercase keys.
- Set `draft: false` only when content is ready to publish.
- Use lowercase, hyphenated slugs for blog folders (example: `content/blog/pihole-doh-cloudflare/`).
- For Chinese content, preserve the dated path + UUID pattern; keep media filenames stable (`audio.mp3`, `thumbnail.png`).
- Post thumbnails must use a 4:3 aspect ratio.
- Use ImageMagick for image editing tasks such as resizing, cropping, format conversion, and thumbnail preparation.
- Reuse existing shortcode patterns instead of introducing new markup styles for similar blocks.

## Testing Guidelines
- There is no separate unit-test suite in this repo; verification is build + manual page checks.
- Before opening a PR, run `make build` and ensure it exits cleanly.
- Preview with `make start` and validate changed pages: images load, shortcodes render, and audio embeds play.

## Commit & Pull Request Guidelines
- Follow the repository’s concise commit style seen in history: action-first subjects such as `new story: ...`, `thumbnail: ...`, `update audio: ...`.
- Keep commits atomic where possible (content text, thumbnail updates, audio updates can be split while iterating).
- PRs should include a short summary, the main changed paths, and screenshots when layouts/theme/config changes affect rendering.
- Link related issues when applicable and call out any submodule updates.
