# Releasing (moteur-plugins)

## Required secrets

- `RELEASE_PAT` — GitHub PAT to **push** the release commit and `plugins@<line>` tag (same pattern as `moteur`: fine-grained **Contents read+write** on this repo; account must push to protected `main`).
- `NPM_STAGING_TOKEN` — granular npm token (**Read and write stage only** on `@moteurio/*`) for `npm stage publish` in CI. Approve staged versions on [npm](https://www.npmjs.com/settings/~/packages/staged) with 2FA after the workflow succeeds.

## Primary release path

Use:

- `.github/workflows/release-orchestrator.yml`
- Trigger with `workflow_dispatch` from the branch you release from (usually `main`).

Inputs:

- **`expected_moteur_line`** — engine line you are publishing plugins for (e.g. `2026.10.23`). Plugin `version` and `@moteurio/types` / `core` / `plugin-sdk` ranges are set to this line automatically.
- **`release_version_override`** — optional; same-day republish suffix (e.g. `2026.10.23-2`) when npm already has that version staged or published.

The workflow checks out **moteur** at tag `moteur@<line>` next to this repo (`pnpm-workspace.yaml` uses `link:../moteur/...`), builds `types`, `plugin-sdk`, and `core`, then:

1. Sets every `packages/plugin-*` `package.json` to the release line (`scripts/set-plugin-release-line.mjs`).
2. Commits `package.json` + `pnpm-lock.yaml` and pushes (skipped if already at the line).
3. Creates/updates tag `plugins@<line>` on the remote.
4. Validates plugin release policy.
5. Builds all plugins.
6. Runs `npm stage publish` for each plugin.

You do **not** need to hand-edit eleven `package.json` files before each release.

Local dry-run:

```bash
EXPECTED_MOTEUR_LINE=2026.10.23 node scripts/set-plugin-release-line.mjs
node scripts/validate-plugin-release-policy.mjs
```

## Policy checks

- `node scripts/validate-plugin-release-policy.mjs`

This enforces:

- plugin packages have `publishConfig.access=public`
- plugin packages have `prepublishOnly`
- internal dependencies on `@moteurio/types`, `@moteurio/core`, `@moteurio/plugin-sdk` match the expected line (e.g. `^2026.10.23`)

## When to run

Run when you want a **new plugin line** on npm for an engine release—not on every engine release if plugin code is unchanged and you are fine keeping the previous plugin line on hosts.

## Rollback policy

If staging fails:

1. Fix the failing package.
2. Use `release_version_override` for a same-day suffix if needed.
3. Re-run the orchestrator.
4. Never republish an existing npm version.

## Host upgrade step

After you **approve** staged plugins on npm, update `api.moteur.io` dependency ranges and redeploy.
