import type { StructureSchema } from '@moteurio/types/Structure.js';

/** Reusable place: name plus a point and optional area. */
export const placeStructureSchema: StructureSchema = {
    type: 'geo/place',
    label: 'Place',
    description: 'A named location with optional area outline.',
    fields: {
        name: { type: 'core/text', label: 'Name', options: { multilingual: true } },
        location: { type: 'geo/location', label: 'Location' },
        area: { type: 'geo/area', label: 'Area' }
    }
};
