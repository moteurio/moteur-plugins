# Host plugins

Moteur's API loads optional plugins selected by the host. Public implementations live in this repository; private AI, presence, billing, storage and other integrations live in `moteur-plugins-extra`. The engine owns the [plugin SDK](https://github.com/moteurio/moteur/tree/main/packages/plugin-sdk) and [Studio plugin SDK](https://github.com/moteurio/moteur/tree/main/packages/studio-plugin-sdk).

## Install and enable

Install a plugin on the API host, then list its module specifier:

```bash
npm install @moteurio/plugin-auth-github
```

```dotenv
MOTEUR_HOST_PLUGINS=@moteurio/plugin-auth-github
MOTEUR_ENABLED_PLUGINS=auth-github
```

`MOTEUR_HOST_PLUGINS` is a comma-separated list of import specifiers. `MOTEUR_ENABLED_PLUGINS` filters loaded modules by manifest ID: unset enables all loaded modules; an empty value enables none. An operator's saved choices in `data/operator/plugins.json` override enablement on the next API start. Each plugin has its own credentials and configuration; installing a package alone does not configure it.

For local development, a module specifier can point to a built local module. Restart the API after changing the composition. Its `/openapi.json` and `/docs` show the routes contributed by that composition, including the configured `API_BASE_PATH` prefix.

## Layers and project scope

| Layer            | Responsibility                                                                 |
| ---------------- | ------------------------------------------------------------------------------ |
| Engine           | Core content services, audit, validation, activity logging and Git integration |
| Host plugin      | Optional API routes, event handlers, schema registrations and adapters         |
| Studio companion | Browser UI, composed into the Studio build through the public Studio SDK       |

AI and Socket.IO presence are host plugins. They are not bundled API features. Git commit-on-save is an engine feature, controlled by `project.git.enabled`.

`manifest.scope: 'global'` ignores the project plugin allowlist. With scope `project` (the default), a handler must check `ctx.isPluginEnabledForProject(projectId, pluginId)`. An unset `project.plugins` allows host-enabled project plugins; a list limits them to those IDs. Scope is an enablement gate, not authentication: routes still need permission checks.

## Authoring and the engine boundary

Use `definePlugin` and `PluginInitContext` from `@moteurio/plugin-sdk`. A module exports a default plugin containing `manifest` and `init(ctx)`, with optional `getRoutes(ctx)`, `getAuthProviders()` and `attachServer(server, app)` hooks. The [SDK README](https://github.com/moteurio/moteur/blob/main/packages/plugin-sdk/README.md) owns the contract and a minimal example. Manifest `role`, `categories`, `contributes` and `requires` are documented in [Plugin architecture](https://github.com/moteurio/moteur/blob/main/docs/Plugin%20architecture.md).

Typical public families: `auth-*` (`categories: ['auth']`), `webhook-*` (`webhook`), `core-blocks` / `core-blueprints` / `geo` / `oembed` (`content`). Geo is the full-stack exemplar (fields, blocks, structures, Studio companion).

Plugins that call engine services import only `@moteurio/core/host.js`. Other core paths are internal. Keep `@moteurio/core`, `@moteurio/types` and `@moteurio/plugin-sdk` as peer dependencies, plus development dependencies for builds. Bundling another copy can split registries, events and settings from the host's copy. The release policy checks this boundary.

Route context supplies `requireAuth`, `requireProjectAccess` and `requireOperator`. After project access checks, `req.user.roles` contains roles in that project. A project member is not necessarily allowed to modify schemas or publish; use the appropriate engine service checks. Platform operations require an operator token.

## Studio companions

API manifests may include `studio` metadata describing a companion package and supported fields, blocks or routes. That metadata does not download or execute browser code. The private Studio host imports companion packages at build time and applies them with `applyStudioPlugins` from `@moteurio/studio-plugin-sdk`. Companion manifests use the same catalog axes (`id`, `label`, `source`, `scope`, `role`, `categories`, `contributes`, `requires`) and pair by `id`.

An API-only installation can omit companions. A usable Studio editor or preview still requires the host to include the matching UI package. Companion examples and private plugin manuals live in `moteur-plugins-extra`. Geo’s companion is `@moteurio/studio-plugin-geo`; the operator console is `@moteurio/studio-plugin-operator`.

## Public implementations

Browse [packages](../packages) for the current catalog. Authentication providers include GitHub, Google, Microsoft and generic OIDC; their `/auth/*` routes exist only when the host loads them. Provider-specific settings are implemented alongside each package. Form data retention (`@moteurio/plugin-form-data-retention`) sets how long each form keeps submissions and answers a person's request for a copy or to be forgotten; see its README. Engine authentication and account-linking rules are documented in [Authentication](https://github.com/moteurio/moteur/blob/main/docs/Authentication.md).

To validate a plugin release, follow this repository's [release instructions](../RELEASING.md). Informal product ideas are not part of the runtime documentation.
