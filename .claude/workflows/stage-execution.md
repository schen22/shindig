# Stage execution

The orchestrator's loop. Workers never read this file.

## The loop

1.  Read `project-state.yaml`. Take `current_stage`.
2.  Read that stage's contract. Read nothing else yet.
3.  Confirm START STATE holds. If it does not, stop and report — do not adapt.
4.  Determine the concurrency group. Stages sharing a `group:` run together, per
    `parallel-execution.md`.
5.  Dispatch each stage's agent with: the contract path, its REQUIRED READING
    list, and nothing more. **Do not paste the product definition into a task.**
6.  Each worker commits in its own worktree and returns the structured report.
7.  Run `npm run build` on each worktree.
    Failure → return the failing check to that worker alone. Do not restart the
    group, and do not re-dispatch workers that passed.
8.  Run the stage's REVIEW LEVEL.
    Blocking findings → return only those, to the owning agent.
    Scope expansion → do not implement. Record under `deferred` if it has merit.
9.  Merge each worker to `alpha` as it passes, not all at once.
10. If a worker cannot finish: merge the ones that did, name what is missing,
    and do not mark the stage complete.
11. Group boundary: run the panel on merged `alpha` if the level requires it.
12. Approve. Commit. `git push origin alpha`. Update `project-state.yaml` —
    status, `last_approved_alpha`, any new deferred items.
13. Stop. Do not begin the next stage unless asked.

**Never:** merge to `main` · push any other branch · edit a frozen file · add a
dependency · let a worker read the whole product definition.

## Review levels

| Level | Applies to | Gates |
| :--- | :--- | :--- |
| **L0** | Docs, comments, this configuration | `npm run build` only |
| **L1** | Isolated data, tests, or content | build + `code-reviewer` on the diff, pre-merge |
| **L2** | Anything a visitor touches | L1 per stage, then `expert-reviewer` once on the merged group |
| **L3** | Final integration | L2, then the orchestrator walks the acceptance criteria itself |

Rules that hold at every level:

- **A dirty worktree never reaches `alpha`.** Review happens before merge.
- The panel runs **once per group, post-merge, on the integrated result** —
  never on unmerged worktrees, which reviews code in isolation from what it has
  to work with.
- **≥90 average and no unresolved blocking issue.** A 91 with a live blocker is
  not a pass.
- **Score alone never closes a stage.** The orchestrator does.
- Anything contradicting `CLAUDE.md`, a stage contract, or a recorded decision
  is **escalated, not fixed**.

## Validation

`npm run build` is the whole of the deterministic gate. It runs `contrast.js`,
`copy.js` and `conformance.js` before the build, then `build.js` and `output.js`
against the emitted site. A failing check fails the deploy.

There is no preview deploy. Netlify builds production only, so nothing on
`alpha` is ever served and checks that need a live URL belong to Stage 10.

## Commit and push

- Subagents commit in their own worktree. **Subagents never push.**
- Only the orchestrator pushes, and only `git push origin alpha`.
- `settings.local.json` enforces this: `git push` is denied except to
  `origin alpha`. The deny rule holds even when an agent has convinced itself
  it needs to push.
- **Merging `alpha` into `main` is Sarah's, by hand.** Nothing here does it.

## Escalate to Opus when

- Two agents disagree, or a review disagrees with a builder, and the contract
  does not settle it.
- A finding spans files owned by two agents — that is a design problem, not a
  bug, and neither agent may reach across the line.
- A stage's START STATE does not hold.
- Something requires changing a frozen file or adding a dependency.
