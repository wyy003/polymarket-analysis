# Development Workflow

Every change to this repository follows this workflow. No exceptions for "small" changes.

---

## Step 0 — Sync main and create a feature branch

```bash
git checkout main
git pull origin main
git checkout -b pr-XXX-short-name
```

Replace `XXX` with the next PR number and `short-name` with a 2–4 word slug (e.g. `pr-003-kalshi-client`).

---

## Step 1 — Write the task markdown

Create `.claude/tasks/pr-XXX-short-name.md` before writing any code.

The task file must contain:

- **Goal** — one sentence.
- **In Scope** — bullet list of exactly what will be implemented.
- **Out of Scope** — bullet list of what will not be touched, even if related.
- **Constraints** — safety, schema, or dependency constraints.
- **Acceptance criteria** — what "done" looks like (build passes, endpoints respond, etc.).

Do not proceed to Step 2 until the task markdown exists and is agreed upon.

---

## Step 2 — Builder implements the task

The builder agent reads `PROJECT_RULES.md`, `WORKFLOW.md`, and the task markdown, then implements only what the task explicitly asks for.

See [agents/builder.md](agents/builder.md) for the full builder contract.

---

## Step 3 — Run build and tests

```bash
npm run build
```

If a test script exists:

```bash
npm test
```

Both must pass before proceeding. Do not open a PR with a failing build.

---

## Step 4 — Reviewer audits

The reviewer agent checks the diff against the task markdown and `PROJECT_RULES.md`.

See [agents/reviewer.md](agents/reviewer.md) for the full reviewer checklist.

The reviewer returns one of:
- **Pass** — safe to commit and open PR.
- **Pass with suggestions** — non-blocking notes; proceed to Step 6.
- **Fail** — blocking issues must be fixed before proceeding.

---

## Step 5 — Fix only blocking issues

Address every issue the reviewer marked **blocking**.
Do not fix non-blocking suggestions in this PR unless they are trivially safe.
Non-blocking suggestions become candidates for a follow-up task.

Return to Step 3 after each fix cycle.

---

## Step 6 — Commit and push the branch

```bash
git status
git add <specific files — never git add -A blindly>
git commit -m "feat: short description of the change"
git push -u origin pr-XXX-short-name
```

Commit message must follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.

---

## Step 7 — Open PR

Open a PR from `pr-XXX-short-name` → `main`.

PR description must include:
- Link to the task markdown.
- Summary of behavior change.
- Build/test result confirmation.
- Any follow-up TODOs that were explicitly deferred.

Wait for human approval before merging.

---

## Cutoff Rule

> If a task starts expanding — new endpoints, new UI, new types, new dependencies not listed in the task — **stop**.
> Do not continue implementing. Create a follow-up task markdown instead.
> A PR that exceeds its stated scope will be rejected in review regardless of build status.

The purpose of this rule is to keep PRs reviewable, reversible, and safe to roll back individually.
