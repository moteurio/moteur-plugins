import { describe, it, expect } from 'vitest';
import { validateAreaField } from '../../src/validators/validateAreaField.js';
import type { Field } from '@moteurio/types/Field.js';

const baseField: Field = { type: 'geo/area', label: 'Test' };

/** Closed square ring in [lng, lat] */
const closedSquare: number[][] = [
    [-73.5, 45.5],
    [-73.4, 45.5],
    [-73.4, 45.6],
    [-73.5, 45.6],
    [-73.5, 45.5]
];

describe('validateAreaField', () => {
    it('allows null and undefined', () => {
        expect(validateAreaField(null, baseField, 'a')).toEqual([]);
    });

    it('rejects non-object', () => {
        const issues = validateAreaField('x', baseField, 'a');
        expect(issues.some((i) => i.code === 'GEO_AREA_INVALID_TYPE')).toBe(true);
    });

    it('rejects unclosed ring', () => {
        const openRing = closedSquare.slice(0, 4);
        const issues = validateAreaField({ polygons: [openRing] }, baseField, 'a');
        expect(issues.some((i) => i.code === 'GEO_AREA_RING_NOT_CLOSED')).toBe(true);
    });

    it('accepts valid closed polygon', () => {
        expect(validateAreaField({ polygons: [closedSquare] }, baseField, 'a')).toEqual([]);
    });
});
