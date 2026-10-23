import { describe, it, expect } from 'vitest';
import { validateLocationField } from '../../src/validators/validateLocationField.js';
import type { Field } from '@moteurio/types/Field.js';

const field: Field = { type: 'geo/location', label: 'Test' };

describe('validateLocationField', () => {
    it('allows null and undefined', () => {
        expect(validateLocationField(null, field, 'loc')).toEqual([]);
        expect(validateLocationField(undefined, field, 'loc')).toEqual([]);
    });

    it('rejects non-object values', () => {
        const issues = validateLocationField('nope', field, 'loc');
        expect(issues.some((i) => i.code === 'GEO_LOCATION_INVALID_TYPE')).toBe(true);
    });

    it('accepts valid lat/lng', () => {
        expect(validateLocationField({ lat: 45.5, lng: -73.5 }, field, 'loc')).toEqual([]);
    });

    it('rejects out-of-range latitude', () => {
        const issues = validateLocationField({ lat: 91, lng: 0 }, field, 'loc');
        expect(issues.some((i) => i.code === 'GEO_LOCATION_LAT_RANGE')).toBe(true);
    });

    it('rejects out-of-range longitude', () => {
        const issues = validateLocationField({ lat: 0, lng: 200 }, field, 'loc');
        expect(issues.some((i) => i.code === 'GEO_LOCATION_LNG_RANGE')).toBe(true);
    });
});
