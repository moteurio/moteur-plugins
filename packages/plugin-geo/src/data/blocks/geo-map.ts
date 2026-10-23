import type { BlockSchema } from '@moteurio/types/Block.js';

/** Block type `geo/map` — universal map: points, areas, polylines. */
export const mapBlockSchema: BlockSchema = {
    type: 'geo/map',
    label: 'Map',
    description: 'Universal map block rendering point, area, and polyline features.',
    category: 'geo',
    fields: {
        center: {
            type: 'geo/location',
            label: 'Map Center',
            description: 'Optional initial center point. If omitted, renderer may fit to features.'
        },
        zoom: {
            type: 'core/number',
            label: 'Zoom',
            description: 'Initial zoom level (commonly 1-20).'
        },
        fitToFeatures: {
            type: 'core/boolean',
            label: 'Fit To Features',
            description: 'Auto-fit viewport to all feature bounds.',
            default: true
        },
        features: {
            type: 'core/list',
            label: 'Features',
            description: 'Mixed geometry features rendered on the same map.',
            options: {
                itemSchema: {
                    type: 'core/object',
                    fields: {
                        kind: {
                            type: 'core/select',
                            label: 'Geometry Type',
                            options: { choices: ['location', 'area', 'polyline'] },
                            required: true
                        },
                        location: { type: 'geo/location', label: 'Location' },
                        area: { type: 'geo/area', label: 'Area' },
                        polyline: { type: 'geo/polyline', label: 'Polyline' },
                        label: {
                            type: 'core/text',
                            label: 'Label',
                            options: { multilingual: true }
                        },
                        color: { type: 'core/color', label: 'Color' }
                    }
                }
            }
        }
    }
};
