# Parallel execution

Coordination mechanics for running several agents at once. The orchestrator's;
workers get their bounds from their contract's IN SCOPE instead.

## Why ownership is disjoint

Merge conflicts between agents are always a symptom of two agents writing the
same file. They are not solved by careful merging — they are solved by ownership
being disjoint in the first place. If ownership is disjoint, merging parallel
worktrees is clean every time, because there is nothing to reconcile.

Two structural consequences, both load-bearing:

- **Component CSS is a globbed directory**, `styles/components/*.css`, one file
  per component, never a single `components.css`. The generator globs in sorted
  order, so adding a component never edits a shared file. Order must never be
  load-bearing — if two components fight over specificity, fix the selectors.
- **Client JS is split per feature** under `public/assets/js/`, never a shared
  `site.js`. Two ~1KB deferred requests is not a cost worth a merge conflict.

## When an agent needs a file it does not own

Stop and report it. Do not edit it, do not work around it, do not copy it. An
unowned edit is how a clean parallel build turns into a three-way conflict
nobody can untangle.

## Frozen files

Nobody edits these, including their original author. They are the shell
everything else builds against, and a change here invalidates work in flight.

`_includes/base.liquid` (including the inline `<head>` script) ·
`_includes/header.liquid` · `_includes/footer.liquid` · `eleventy.config.js` ·
`_data/site.js` · `_data/nav.js` · `package.json` · `netlify.toml` ·
`public/_headers` · `public/robots.txt`

Single-writer for a different reason: **`_data/palettes.js`** is the single
source of colour. Two writers reintroduces exactly the drift the architecture
exists to eliminate.

Need one changed? Stop, report, and let it be done between stages.

**Two files legitimately appear twice.** Both are deliberate, and naming them is
what keeps the rule credible:

1. `_includes/theme-toggle.liquid` — Stage 0 shipped a placeholder because
   `header.liquid` includes it and a missing include fails the build. **Stage 6
   overwrites the file; it never edits the include line.**
2. `src/index.liquid`, `src/rsvp.liquid`, `src/details.md` — Stage 0 shipped
   stubs so the build has three pages; Stages 5, 7 and 8 replace their contents.
   The shell is Stage 0's, the content is theirs.

## Branches and worktrees

| Branch | Who writes it | What it is |
| :--- | :--- | :--- |
| `main` | **Sarah only** | What Netlify deploys. Receives from `alpha`, when Sarah decides. |
| `alpha` | the orchestrator | The integration branch. Every stage lands here. |
| `stageN/<name>` | one agent each | A worktree branch. Deleted after merge. |

Agents branch from `alpha`, work in their own worktree, commit, pass review,
and are merged by the orchestrator.

## Merge order

**Merge as each agent passes, not all at once.** Waiting for the slowest means
the first three sit unverified; merging on completion means a conflict — if
ownership somehow slipped — surfaces against one small diff instead of four.

**When an agent cannot finish:** merge the agents that did pass, report exactly
what is missing, and **do not declare the stage complete**. Holding clean
worktrees hostage to one failure helps nobody, but a stage that closes with a
feature missing is worse — it makes the next stage build on a gap nobody is
tracking.

## Honest sizing

This is three pages of static HTML. Parallelism saves perhaps twenty minutes,
and the coordination overhead is a real fraction of that. It is used because it
keeps merges clean and blast radius small, not because it is fast. Do not spend
setup effort on maximising agent count.
