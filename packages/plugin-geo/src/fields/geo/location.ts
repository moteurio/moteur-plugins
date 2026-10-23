import type { FieldSchema } from '@moteurio/types/Field.js';
import { validateLocationField } from '../../validators/validateLocationField.js';

export const locationFieldSchema: FieldSchema = {
    type: 'geo/location',
    label: 'Geo Location',
    description: 'A single point location with latitude and longitude.',
    validate: validateLocationField,
    fields: {
        lat: { type: 'core/number', label: 'Latitude', required: true },
        lng: { type: 'core/number', label: 'Longitude', required: true },
        label: { type: 'core/text', label: 'Label', required: false }
    },
    optionsSchema: {
        required: {
            type: 'core/boolean',
            label: 'Required',
            default: false,
            required: false
        },
        ui: {
            type: 'core/text',
            label: 'UI Hint',
            description: 'Optional hint for Studio input rendering (e.g. "map", "input").',
            required: false
        }
    }
};
