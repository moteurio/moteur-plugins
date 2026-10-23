# Releasing (moteur-plugins)

## Required secrets

- `NPM_TOKEN` with publish permissions for plugin packages.

## Primary release path

Use:

- `.github/workflows/release-orchestrator.yml`
- Trigger with `workflow_dispatch`.
- Provide `expected_moteur_line` (default `2026.3.27`) to enforce compatibility with core packages (see `moteur/VERSIONING.md` in the main engine repo).

The workflow:

1. validates plugin release policy
2. builds all `packages/plugin-*`
3. publishes all plugin packages sequentially

## Policy checks

- `node scripts/validate-plugin-release-policy.mjs`

This enforces:

- plugin packages have `publishConfig.access=public`
- plugin packages have `prepublishOnly`
- internal dependencies on `@moteurio/types`, `@moteurio/core`, `@moteurio/ai`, `@moteurio/plugin-sdk` match the expected line (e.g. `^2026.3.27`)

## Rollback policy

If publishing fails:

1. Fix the failing package.
2. Bump version(s) for packages that need republish.
3. Re-run release orchestrator.
4. Never republish an existing npm version.

## Host upgrade step

After successful plugin release, update `api.moteur.io` dependency ranges and regenerate its lockfile from npm.
