# moteur-plugins

Dedicated repository for public Moteur plugins.

Goals:

- keep plugins independent from `@moteurio/api` and `@moteurio/core` packaging
- publish plugin packages independently
- keep plugin runtime contracts aligned with `@moteurio/plugin-sdk`

This repository hosts migrated plugin packages from `moteur/packages/plugins/*` under `packages/plugin-*`.

## Public and private plugins

This repository keeps the **public** plugins (MIT, published to npm). The private ones (billing,
AI providers, video hosts, storage, search, presence…) live in the private
**`moteur-plugins-extra`** repository and are released as tarballs on its GitHub Releases for
`api.moteur.io`, never to npm. Versions `2026.3.27` of the plugins that moved stay on npm under
MIT; later versions are not published.
