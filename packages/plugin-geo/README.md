# @moteurio/plugin-geo

Optional Moteur plugin that registers **geo field types** and a universal **`geo/map`** block.

## Features

| Type | Description |
|------|-------------|
| `geo/location` | Single point: `{ lat, lng }` (+ optional `label`). |
| `geo/polyline` | Path: `{ points: [ [lng, lat], ... ] }`. |
| `geo/area` | Polygons: `{ polygons: [ ring, ... ] }` where each ring is a closed `[lng, lat][]`. |
| `geo/map` | Block that can mix location, area, and polyline features on one map. |

## Enablement

Loaded when the `geo` plugin id is included in server optional plugins (see [Plugins](../../docs/Plugins.md)).

- **`MOTEUR_OPTIONAL_PLUGINS`** — include `geo` (it is part of the default list when unset).
- Per-project: `project.plugins` can restrict which optional plugins apply.

## Layout (mirrors core: fields per file + `data/blocks` like plugin-core-blocks)

```
src/
  fields/geo/          # one file per field schema
    location.ts
    polyline.ts
    area.ts
    index.ts
  data/blocks/         # one file per block schema (cf. plugin-core-blocks `data/coreBlocks.ts`)
    geo-map.ts           # geo/map
    index.ts             # geoBlockSchemas[]
  validators/
    geoCommon.ts
    validateLocationField.ts
    validatePolylineField.ts
    validateAreaField.ts
  index.ts               # manifest + init()
tests/
  validators/*.test.ts
  plugin.test.ts
```

## Development

```bash
# From repo root
pnpm --filter @moteurio/plugin-geo build
pnpm --filter @moteurio/plugin-geo test
```

## Coordinate conventions

- **`geo/location`**: `lat` / `lng` as separate number properties (degrees).
- **`geo/polyline`** / **`geo/area`**: positions are **`[lng, lat]`** arrays (GeoJSON order).

## See also

- [Fields](../../docs/Fields.md) — core field reference; geo types are plugin-provided.
- [Plugins](../../docs/Plugins.md) — optional plugin contract and env vars.
