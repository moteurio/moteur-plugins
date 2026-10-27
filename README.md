# moteur-plugins

Dedicated repository for public Moteur plugins.

Goals:

- keep plugins independent from `@moteurio/api` and `@moteurio/core` packaging
- publish plugin packages independently
- keep plugin runtime contracts aligned with `@moteurio/plugin-sdk`

Each plugin runs on its host's engine: `@moteurio/core`, `types` and `plugin-sdk` are **peer
dependencies** (and dev dependencies, to build), so the API and its plugins share one copy of
core. Plugins import core only from `@moteurio/core/host.js`, the surface the engine keeps stable
for them; its other paths are internal and may change. The release policy check enforces both.

## Public and private plugins

This repository keeps the **public** plugins (MIT, published to npm). The private ones (billing,
AI providers, video hosts, storage, search, presence…) live in the private
**`moteur-plugins-extra`** repository and are released as tarballs on its GitHub Releases for
`api.moteur.io`, never to npm. (npm still has MIT versions `2026.3.27` of some of them; they get
no updates.)

## Documentation

[Host plugins](docs/Plugins.md) covers installation, API/Studio layers, project scope, authoring and the engine SDK boundary. Runtime manuals belong to their implementation repository; private AI and presence manuals live in `moteur-plugins-extra`.
