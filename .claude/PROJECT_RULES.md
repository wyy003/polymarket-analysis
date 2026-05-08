# Project Rules

## Goal

Evolve this repository from a Polymarket analysis dashboard into a read-only Polymarket/Kalshi arbitrage scanner.
The scanner surfaces genuine cross-venue price discrepancies. It does not place trades.

Progression: scanner → paper trading (future) → live trading (requires explicit future approval).

---

## Safety Principles

**Scanner first, no automatic trading now.**
No code that places, modifies, or cancels orders on any venue is permitted in this repository until a dedicated task is approved, scoped, and reviewed specifically for that purpose.

---

## Branch and PR Rules

- Never push directly to `main`.
- Every code change lives on a feature branch: `pr-XXX-short-name`.
- Every branch must have a corresponding task markdown file in `.claude/tasks/` before implementation begins.
- PRs must be small and focused: one logical change per PR.
- `npm run build` must pass before a PR is opened.
- No PR merges unless the reviewer agent returns **pass**.

---

## Task Scoping Rules

- Every task markdown must include an explicit **In Scope** and **Out of Scope** section.
- If implementation starts expanding beyond the stated scope, stop. Create a follow-up task instead of continuing in the current PR.
- Out-of-scope work done speculatively will block the PR.

---

## Secrets and Credentials

- No API keys, tokens, or credentials committed to the repository.
- Secrets live in `.env` files that are listed in `.gitignore`.
- Code must read credentials from environment variables only.

---

## Arbitrage Correctness Rules

A result may only be labelled "arbitrage opportunity" if all of the following hold:

1. **Same event** — both sides resolve on the same real-world outcome.
2. **Same resolution rules** — verify settlement conditions match across venues.
3. **Orderbook-level executable prices** — use actual bid/ask prices, not mid or last.
4. **Fees and slippage accounted for** — net profit after platform fees must be positive.
5. **Risk flags present** — liquidity depth, time-to-resolution, and counterparty risk must be surfaced.

Title-similarity matching alone is never sufficient to declare an arbitrage opportunity.

---

## Market Matching Rules

- Market identity matching must be conservative.
- A Polymarket market and a Kalshi market are considered the same event only when confirmed by external ID (event slug, conditionId, ticker pattern) or a manually curated mapping.
- Jaccard / keyword similarity on question text must not be used as the sole matching criterion.

---

## Code Quality Rules

- TypeScript strict mode. No `any` unless unavoidable and commented.
- All new server endpoints must handle errors and return consistent JSON shapes.
- Do not add unrelated refactors, abstractions, or comments to files you did not need to touch.
- `npm run build` is the minimum verification bar; if a test suite exists, run it too.
