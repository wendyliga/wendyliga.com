# Review instructions

Shared by every automated reviewer of this repository. `AGENTS.md` holds the
project context; this file only says what to report and how.

## What Important means here

This is a personal Hugo site with one maintainer. Reserve Important for a
change that would:

- break the deploy, or publish a page that readers see broken: missing or
  wrong media, a shortcode that renders wrong, a script error that disables
  the audio player or the read-along
- show readers wrong learning content: pinyin or English attached to the
  wrong sentence
- weaken a workflow: an exposed secret, broader `permissions:`, a dropped
  owner or same-repository guard, or pull request text reaching a `run:`
  block or a prompt

Everything else is a Nit at most, including a broken `AGENTS.md` rule that
does not change what readers see. If your tool has its own severity labels,
keep its highest ones for Important findings.

## Cap the nits

Report at most three Nits per review, each with a concrete fix. Leave out
style preferences, naming, and refactoring suggestions.

## On a re-review

After a new push, report only Important findings in what changed since the
last review. Do not repeat a finding that is already posted.

## Do not report

- Anything a pull request check already fails on: Hugo build errors (the
  `audio` and `read-along` shortcodes validate their files and timings),
  broken internal links, actionlint and ShellCheck findings. The deploy in
  `hugo.yaml` and the scheduled `hugo-release.yaml` do not run on pull
  requests, so do review those
- An action, Hugo, or AI model version that looks too new or unknown.
  Versions here are often newer than your training data, and CI proves that
  they exist
- Wording, tone, or translation style in stories and blog posts, and pinyin
  tone-sandhi conventions
- What a diff cannot show: image dimensions, audio content
- The contents of `themes/congo/`, `.frontmatter/`, `frontmatter.json`, and
  `.vscode/`
- Problems that were already there before this pull request

## Before you post

A finding that something fails or behaves wrongly needs the `path:line` that
causes it and the reason. A guess from a name, or from how Hugo, Congo, or
GitHub Actions behaved in an older version, is not enough. If you cannot
confirm it from the repository, leave it out.

## Always check

- A new or moved story sits at
  `content/chinese/<year>/<month>/<day>/<uuid>.md`, the path matches its
  front matter `date`, and its media is in the sibling `<uuid>/` folder as
  `audio.mp3`, `thumbnail.png`, and, for a read-along,
  `sentence-timings.json`
- In a new or changed `sentence-timings.json`, each entry's `pinyin` and
  `english` belong to the Chinese sentence on the same line of the
  `read-along` block. The build compares only the counts, so a shift of one
  line passes it
- A `data-*` attribute, class, `id`, or shortcode parameter renamed in
  `layouts/` is renamed everywhere it is used in `assets/js/`, `assets/css/`,
  and `content/`. These are joined only at runtime
- Audio player and read-along controls stay real buttons with an accessible
  name, and work from the keyboard
- A step that is given a repository secret uses an action pinned to a commit
  SHA
- A change to the Hugo install or build steps is made in `ci.yaml`,
  `hugo.yaml`, and `hugo-release.yaml` alike, and the Hugo version comes only
  from `.hugo-version`
- A changed `themes/congo` pointer or `.hugo-version` is named in the pull
  request description
- `AGENTS.md` still describes the behavior the pull request changes (Nit)
