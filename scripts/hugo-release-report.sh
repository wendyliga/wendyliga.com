#!/usr/bin/env bash
# Reports the result of the Hugo release check
# (.github/workflows/hugo-release.yaml).
#
# With Issues enabled on the repository it keeps one tracking issue: opened
# when a newer Hugo exists, updated by later runs, closed once .hugo-version
# catches up. With Issues disabled it fails the run instead, because a failed
# run is then the only thing GitHub notifies about by default. A manual run on
# a branch other than the default one only writes the run summary.
#
# Reads PINNED, LATEST, OUTDATED (true|false), BUILD (success|failure|skipped)
# and RUN_URL from the environment, plus GH_REPO and GH_TOKEN for gh.
set -euo pipefail

: "${PINNED:?}" "${LATEST:?}" "${OUTDATED:?}" "${RUN_URL:?}" "${GH_REPO:?}"

# This job can write issues, and these values come from the job that ran a
# Hugo release nobody has reviewed yet. Accept the expected shapes only, and
# do not echo a value that fails.
for version in "$PINNED" "$LATEST"; do
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "::error::A Hugo version passed to the report is not x.y.z"; exit 1; }
done
[[ "$OUTDATED" == "true" || "$OUTDATED" == "false" ]] || { echo "::error::OUTDATED passed to the report is not true or false"; exit 1; }

# Hidden in the issue body; later runs find the issue by it.
marker='<!-- hugo-release-check -->'
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
server="${GITHUB_SERVER_URL:-https://github.com}"

repo="$(gh api "repos/$GH_REPO")"
has_issues="$(jq -r .has_issues <<< "$repo")"
default_branch="$(jq -r .default_branch <<< "$repo")"

# Only a run on the default branch speaks for the pin that gets deployed. A
# manual run on another branch must not open, rewrite, or close the issue.
on_default_branch=true
[[ "${GITHUB_REF_NAME:-$default_branch}" == "$default_branch" ]] || on_default_branch=false

# The open tracking issue, if any. Listing by creator keeps an issue that
# someone else opened with the marker in it from being taken for ours.
number=""
old_title=""
if [[ "$has_issues" == "true" && "$on_default_branch" == "true" ]]; then
  tracking="$(gh api "repos/$GH_REPO/issues?state=open&creator=github-actions%5Bbot%5D&per_page=100" \
    | jq -c --arg marker "$marker" \
      '[.[] | select(.pull_request == null) | select((.body // "") | contains($marker))] | sort_by(.number) | first // empty')"
  if [[ -n "$tracking" ]]; then
    number="$(jq -r .number <<< "$tracking")"
    old_title="$(jq -r .title <<< "$tracking")"
  fi
fi

if [[ "$OUTDATED" != "true" ]]; then
  echo "Hugo is up to date: \`.hugo-version\` pins $PINNED and the latest release is $LATEST." >> "$summary"
  if [[ -n "$number" ]]; then
    gh issue close "$number" --comment "\`.hugo-version\` now pins Hugo $PINNED and the latest release is $LATEST."
  fi
  exit 0
fi

case "${BUILD:-}" in
  success)
    title="Hugo $LATEST is available and builds the site"
    result="**The site builds cleanly with Hugo $LATEST**, using the same steps as the \`CI / Build site\` check."
    bump="To bump,"
    ;;
  failure)
    title="Hugo $LATEST is available but fails to build the site"
    # There is no build with the pinned Hugo to compare against, so point at
    # the deploy: if that fails too, the new Hugo is not the cause.
    result="**The site does not build with Hugo $LATEST.** The error is in the \`Build with Hugo\` step of the run linked below. If the [latest deploy]($server/$GH_REPO/actions/workflows/hugo.yaml) is failing as well, the cause is the site and not the new Hugo."
    bump="Once the site or the theme is fixed,"
    ;;
  *)
    echo "::error::Unexpected build result passed to the report"
    exit 1
    ;;
esac

body="$(mktemp)"
cat > "$body" <<EOF
$marker
Hugo **$LATEST** is out and \`.hugo-version\` still pins **$PINNED**.

$result

$bump [edit \`.hugo-version\`]($server/$GH_REPO/edit/$default_branch/.hugo-version) so that its one line reads:

\`\`\`
$LATEST
\`\`\`

Propose the change as a pull request instead of committing to \`$default_branch\`. A pull request you open runs \`CI / Build site\` and a Cloudflare Pages preview with the new version before anything is deployed.

- [Hugo $LATEST release notes](https://github.com/gohugoio/hugo/releases/tag/v$LATEST)
- [Every Hugo change since $PINNED](https://github.com/gohugoio/hugo/compare/v$PINNED...v$LATEST)
- [The run that built the site with Hugo $LATEST]($RUN_URL)
EOF

{
  echo "### $title"
  cat "$body"
} >> "$summary"

if [[ "$on_default_branch" != "true" ]]; then
  echo "::notice::Not a run on the default branch, so the result is in the run summary only."
  exit 0
fi

if [[ "$has_issues" != "true" ]]; then
  echo "::error title=$title::.hugo-version pins $PINNED. Issues are disabled for $GH_REPO, so this failed run is the notification. The run summary has the details."
  exit 1
fi

cat >> "$body" <<EOF

The \`Hugo release check\` workflow keeps this issue up to date and closes it once \`.hugo-version\` catches up. Leave it open until then: if it is closed by hand, the next run opens a new one.
EOF

if [[ -z "$number" ]]; then
  gh issue create --title "$title" --body-file "$body"
else
  gh issue edit "$number" --title "$title" --body-file "$body"
  # Editing an issue notifies nobody, so comment when the news has changed.
  if [[ "$old_title" != "$title" ]]; then
    gh issue comment "$number" --body "$title. The description above has the details."
  fi
fi
