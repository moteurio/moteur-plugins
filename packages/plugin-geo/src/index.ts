/**
 * Optional plugin: Geo fields and map block.
 * Registers geo/location, geo/area, geo/polyline and geo/map block.
 */
import type { PluginManifest } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import { geoBlockSchemas } from './data/blocks/index.js';
import { geoFieldSchemas } from './fields/geo/index.js';

export const manifest: PluginManifest = {
    id: 'geo',
    label: 'Geo fields and blocks',
    description: 'Geo field types (location, area, polyline) and a universal map block.',
    source: 'opensource',
    kind: 'optional',
    scope: 'project'
};

export function init(ctx: PluginContext): void {
    for (const field of geoFieldSchemas) {
        ctx.registerFieldSchema(field);
    }
    for (const schema of geoBlockSchemas) {
        ctx.registerBlockSchema(schema);
    }
}

export default { manifest, init };
