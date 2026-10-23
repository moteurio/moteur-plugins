import { describe, it, expect } from 'vitest';
import { validatePolylineField } from '../../src/validators/validatePolylineField.js';
import type { Field } from '@moteurio/types/Field.js';

const baseField: Field = { type: 'geo/polyline', label: 'Test' };

describe('validatePolylineField', () => {
    it('allows null and undefined', () => {
        expect(validatePolylineField(null, baseField, 'p')).toEqual([]);
    });

    it('rejects invalid wrapper', () => {
        const issues = validatePolylineField([], baseField, 'p');
        expect(issues.some((i) => i.code === 'GEO_POLYLINE_INVALID_TYPE')).toBe(true);
    });

    it('rejects missing points array', () => {
        const issues = validatePolylineField({ points: 'bad' }, baseField, 'p');
        expect(issues.some((i) => i.code === 'GEO_POLYLINE_POINTS_REQUIRED')).toBe(true);
    });

    it('rejects too few points', () => {
        const issues = validatePolylineField(
            { points: [[0, 0]] },
            { ...baseField, options: { minPoints: 2 } },
            'p'
        );
        expect(issues.some((i) => i.code === 'GEO_POLYLINE_TOO_SHORT')).toBe(true);
    });

    it('accepts valid polyline', () => {
        const issues = validatePolylineField(
            {
                points: [
                    [-73.5, 45.5],
                    [-73.4, 45.6]
                ]
            },
            baseField,
            'p'
        );
        expect(issues).toEqual([]);
    });
});
