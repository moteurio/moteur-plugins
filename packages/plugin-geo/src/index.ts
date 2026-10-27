/**
 * Optional plugin: Geo fields, map block, place structure, and map-site blueprint.
 */
import type { PluginManifest } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import { geoBlockSchemas } from './data/blocks/index.js';
import { geoFieldSchemas } from './fields/geo/index.js';
import { placeStructureSchema } from './data/structures/place.js';
import { mapSiteBlueprint } from './data/blueprints/mapSite.js';

export const manifest: PluginManifest = {
    id: 'geo',
    label: 'Geo fields and blocks',
    description:
        'Geo field types (location, area, polyline), a map block, place structure, and map-site blueprint.',
    source: 'opensource',
    kind: 'optional',
    scope: 'project',
    categories: ['content'],
    contributes: {
        schemas: {
            fields: ['geo/location', 'geo/area', 'geo/polyline'],
            blocks: ['geo/map'],
            structures: ['geo/place'],
            blueprints: ['map-site'],
            models: ['place']
        },
        frontend: {
            companionPackage: '@moteurio/frontend-plugin-geo',
            blocks: ['geo/map'],
            webComponents: ['moteur-geo-map']
        }
    },
    studio: {
        companionPackage: '@moteurio/studio-plugin-geo',
        fieldTypes: ['geo/location', 'geo/area', 'geo/polyline'],
        blockTypes: ['geo/map']
    }
};

export function init(ctx: PluginContext): void {
    for (const field of geoFieldSchemas) {
        ctx.registerFieldSchema(field);
    }
    for (const schema of geoBlockSchemas) {
        ctx.registerBlockSchema(schema);
    }
    ctx.registerStructureSchema(placeStructureSchema);
    ctx.registerBlueprint(mapSiteBlueprint);
    ctx.registerModelTemplate({
        id: 'place',
        label: 'Place',
        description: 'A location on a map',
        fields: {
            name: { type: 'core/text', label: 'Name', options: { multilingual: true } },
            location: { type: 'geo/location', label: 'Location' },
            area: { type: 'geo/area', label: 'Area' }
        }
    });
}

export default { manifest, init };
