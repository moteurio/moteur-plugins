import type { FieldSchema } from '@moteurio/types/Field.js';
import { validatePolylineField } from '../../validators/validatePolylineField.js';

export const polylineFieldSchema: FieldSchema = {
    type: 'geo/polyline',
    label: 'Geo Polyline',
    description: 'A route or path represented by ordered [lng, lat] points.',
    validate: validatePolylineField,
    fields: {
        points: { type: 'core/json', label: 'Points', required: true }
    },
    optionsSchema: {
        minPoints: {
            type: 'core/number',
            label: 'Minimum Points',
            default: 2,
            required: false
        }
    }
};
