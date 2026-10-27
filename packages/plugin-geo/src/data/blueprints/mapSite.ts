import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import { placeStructureSchema } from '../structures/place.js';

/** Starter for a map-heavy project: a Place model and the geo/place structure. */
export const mapSiteBlueprint: BlueprintSchema = {
    id: 'map-site',
    name: 'Map-heavy site',
    description: 'A project starter with a Place model and geo/place structure.',
    kind: 'project',
    template: {
        models: [
            {
                id: 'place',
                label: 'Place',
                description: 'A location on a map',
                fields: {
                    name: { type: 'core/text', label: 'Name', options: { multilingual: true } },
                    location: { type: 'geo/location', label: 'Location' },
                    area: { type: 'geo/area', label: 'Area' }
                }
            }
        ],
        layouts: [],
        structures: [placeStructureSchema]
    }
};
