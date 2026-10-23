import type { FieldSchema } from '@moteurio/types/Field.js';
import { areaFieldSchema } from './area.js';
import { locationFieldSchema } from './location.js';
import { polylineFieldSchema } from './polyline.js';

/** All geo field schemas registered by the plugin (order: location, polyline, area). */
export const geoFieldSchemas: FieldSchema[] = [
    locationFieldSchema,
    polylineFieldSchema,
    areaFieldSchema
];

export { areaFieldSchema, locationFieldSchema, polylineFieldSchema };
