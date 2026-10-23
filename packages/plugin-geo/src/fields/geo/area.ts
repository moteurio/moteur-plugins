import type { FieldSchema } from '@moteurio/types/Field.js';
import { validateAreaField } from '../../validators/validateAreaField.js';

export const areaFieldSchema: FieldSchema = {
    type: 'geo/area',
    label: 'Geo Area',
    description:
        'One or more polygon rings represented as [ [lng,lat], ... ] coordinate arrays.',
    validate: validateAreaField,
    fields: {
        polygons: { type: 'core/json', label: 'Polygons', required: true }
    },
    optionsSchema: {
        minPointsPerRing: {
            type: 'core/number',
            label: 'Minimum Points Per Ring',
            default: 4,
            required: false
        }
    }
};
