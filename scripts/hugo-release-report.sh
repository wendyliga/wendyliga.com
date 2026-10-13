#!/usr/bin/env bash
# Reports the result of the Hugo release check
# (.github/workflows/hugo-release.yaml).
#
# Keeps one pull request that bumps .hugo-version to the latest Hugo, from the
# hugo-release-check branch: opened when a newer Hugo exists, moved to each
# later release while it stays open, closed once .hugo-version catches up. A
# manual run on a branch other than the default one only writes the run
# summary.
#
# A pull request opened, or a commit pushed, with GITHUB_TOKEN starts no
# workflows, so CI does not run on what this script writes. The pull request
# opens as a draft, and goes back to draft whenever this script commits to it:
# marking it ready for review runs CI as the person who does it.
#
# Reads PINNED, LATEST, OUTDATED (true|false), BUILD (success|failure|skipped)
# and RUN_URL from the environment, plus GH_REPO and GH_TOKEN for gh, and
# GITHUB_SHA, the commit the check job built.
set -euo pipefail

: "${PINNED:?}" "${LATEST:?}" "${OUTDATED:?}" "${RUN_URL:?}" "${GH_REPO:?}" "${GITHUB_SHA:?}"

# This job can write to the repository, and these values come from the job
# that ran a Hugo release nobody has reviewed yet. Accept the expected shapes
# only, and do not echo a value that fails.
for version in "$PINNED" "$LATEST"; do
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "::error::A Hugo version passed to the report is not x.y.z"; exit 1; }
done
[[ "$OUTDATED" == "true" || "$OUTDATED" == "false" ]] || { echo "::error::OUTDATED passed to the report is not true or false"; exit 1; }

branch="hugo-release-check"
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
server="${GITHUB_SERVER_URL:-https://github.com}"

default_branch="$(gh api "repos/$GH_REPO" --jq .default_branch)"

# Only a run on the default branch speaks for the pin that gets deployed. A
# manual run on another branch must not open, change, or close the pull
# request.
on_default_branch=true
[[ "${GITHUB_REF_NAME:-$default_branch}" == "$default_branch" ]] || on_default_branch=false

# The open pull request from $branch, if any. Whoever opened it, it is the one
# later runs keep up to date.
number=""
old_title=""
node_id=""
draft=""
if [[ "$on_default_branch" == "true" ]]; then
  pull="$(gh api "repos/$GH_REPO/pulls?state=open&head=${GH_REPO%%/*}:$branch" | jq -c 'first // empty')"
  if [[ -n "$pull" ]]; then
    number="$(jq -r .number <<< "$pull")"
    old_title="$(jq -r .title <<< "$pull")"
    node_id="$(jq -r .node_id <<< "$pull")"
    draft="$(jq -r .draft <<< "$pull")"
  fi
fi

if [[ "$OUTDATED" != "true" ]]; then
  echo "Hugo is up to date: \`.hugo-version\` pins $PINNED and the latest release is $LATEST." >> "$summary"
  if [[ -n "$number" ]]; then
    gh api "repos/$GH_REPO/issues/$number/comments" \
      -f body="\`.hugo-version\` on \`$default_branch\` now pins Hugo $PINNED and the latest release is $LATEST." > /dev/null
    gh api -X PATCH "repos/$GH_REPO/pulls/$number" -f state=closed > /dev/null
    gh api -X DELETE "repos/$GH_REPO/git/refs/heads/$branch"
  fi
  exit 0
fi

case "${BUILD:-}" in
  success)
    title="Bump Hugo to $LATEST, which builds the site"
    result="**The site builds cleanly with Hugo $LATEST**, using the same steps as the \`CI / Build site\` check."
    ;;
  failure)
    title="Bump Hugo to $LATEST, which fails to build the site"
    # There is no build with the pinned Hugo to compare against, so point at
    # the deploy: if that fails too, the new Hugo is not the cause.
    result="**The site does not build with Hugo $LATEST.** Do not merge until it does. The error is in the \`Build with Hugo\` step of the run linked below. If the [latest deploy]($server/$GH_REPO/actions/workflows/hugo.yaml) is failing as well, the cause is the site and not the new Hugo. Push the fix for the site or the theme to this branch, or to \`$default_branch\`."
    ;;
  *)
    echo "::error::Unexpected build result passed to the report"
    exit 1
    ;;
esac

body="$(mktemp)"
cat > "$body" <<EOF
Hugo **$LATEST** is out and \`.hugo-version\` on \`$default_branch\` still pins **$PINNED**. This pull request changes that one line to $LATEST.

$result

**Mark this pull request ready for review to run \`CI / Build site\` on it.** The \`Hugo release check\` workflow writes it with \`GITHUB_TOKEN\`, and what that token opens or pushes starts no workflows, so CI has not run yet. Then check the Cloudflare Pages preview before merging.

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

cat >> "$body" <<EOF

The \`Hugo release check\` workflow keeps this pull request up to date: a newer Hugo moves it to that release and turns it back into a draft, and it is closed once \`.hugo-version\` catches up. Commits pushed to \`$branch\` stay. If it is closed by hand, the next run opens a new one.
EOF

# With no open pull request, whatever is left on the branch belongs to one
# that was merged or closed: start it over from the commit the check job built.
if [[ -z "$number" ]]; then
  if gh api "repos/$GH_REPO/git/ref/heads/$branch" > /dev/null 2>&1; then
    gh api -X PATCH "repos/$GH_REPO/git/refs/heads/$branch" -f sha="$GITHUB_SHA" -F force=true > /dev/null
  else
    gh api "repos/$GH_REPO/git/refs" -f ref="refs/heads/$branch" -f sha="$GITHUB_SHA" > /dev/null
  fi
fi

# Commit only when the branch does not pin $LATEST yet, on top of whatever is
# there, so a run with nothing new leaves the branch, and its CI, alone.
file="$(gh api "repos/$GH_REPO/contents/.hugo-version?ref=$branch")"
committed=false
if [[ "$(jq -r .content <<< "$file" | base64 -d | tr -d '[:space:]')" != "$LATEST" ]]; then
  gh api -X PUT "repos/$GH_REPO/contents/.hugo-version" \
    -f branch="$branch" \
    -f sha="$(jq -r .sha <<< "$file")" \
    -f message="hugo: bump to $LATEST" \
    -f content="$(printf '%s\n' "$LATEST" | base64)" > /dev/null
  committed=true
fi

if [[ -z "$number" ]]; then
  gh api "repos/$GH_REPO/pulls" \
    -f base="$default_branch" \
    -f head="$branch" \
    -f title="$title" \
    -F body=@"$body" \
    -F draft=true > /dev/null || {
    echo "::error::Could not open the pull request. If the error above says GitHub Actions is not permitted to create pull requests, turn on Settings > Actions > General > Workflow permissions > Allow GitHub Actions to create and approve pull requests."
    exit 1
  }
else
  gh api -X PATCH "repos/$GH_REPO/pulls/$number" -f title="$title" -F body=@"$body" > /dev/null
  # A new commit has not been through CI, so it waits for ready for review
  # again. REST cannot turn a pull request into a draft.
  if [[ "$committed" == "true" && "$draft" != "true" ]]; then
    # $id is a GraphQL variable, not a shell one.
    # shellcheck disable=SC2016
    gh api graphql -f id="$node_id" \
      -f query='mutation($id: ID!) { convertPullRequestToDraft(input: {pullRequestId: $id}) { clientMutationId } }' > /dev/null
  fi
  # Editing a pull request notifies nobody, so comment when the news has
  # changed.
  if [[ "$old_title" != "$title" ]]; then
    gh api "repos/$GH_REPO/issues/$number/comments" -f body="$title. The description above has the details." > /dev/null
  fi
fi
