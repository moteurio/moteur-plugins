import type { Field } from '@moteurio/types/Field.js';
import type { ValidationIssue } from '@moteurio/types/ValidationResult.js';
import { isPlainObject, pushIssue, validateLngLatPair } from './geoCommon.js';

export function validateAreaField(value: unknown, field: Field, path: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (value === null || value === undefined) return issues;
    if (!isPlainObject(value)) {
        pushIssue(
            issues,
            path,
            'GEO_AREA_INVALID_TYPE',
            'Expected an object with polygons: [ [ [lng,lat], ... ] ].',
            { value }
        );
        return issues;
    }

    const polygons = value.polygons;
    if (!Array.isArray(polygons)) {
        pushIssue(
            issues,
            `${path}.polygons`,
            'GEO_AREA_POLYGONS_REQUIRED',
            'Expected polygons to be an array.',
            { value: polygons }
        );
        return issues;
    }

    const minPointsPerRing =
        typeof field.options?.minPointsPerRing === 'number' && field.options.minPointsPerRing >= 4
            ? field.options.minPointsPerRing
            : 4;

    for (let i = 0; i < polygons.length; i += 1) {
        const ring = polygons[i];
        if (!Array.isArray(ring)) {
            pushIssue(
                issues,
                `${path}.polygons[${i}]`,
                'GEO_AREA_RING_INVALID',
                'Each polygon ring must be an array of [lng, lat] pairs.',
                { value: ring }
            );
            continue;
        }
        if (ring.length < minPointsPerRing) {
            pushIssue(
                issues,
                `${path}.polygons[${i}]`,
                'GEO_AREA_RING_TOO_SHORT',
                `Each polygon ring requires at least ${minPointsPerRing} points (closed ring).`,
                { value: ring.length }
            );
        }
        for (let j = 0; j < ring.length; j += 1) {
            issues.push(...validateLngLatPair(ring[j], `${path}.polygons[${i}][${j}]`));
        }

        if (ring.length >= 2) {
            const first = ring[0];
            const last = ring[ring.length - 1];
            const isClosed =
                Array.isArray(first) &&
                Array.isArray(last) &&
                first.length === 2 &&
                last.length === 2 &&
                first[0] === last[0] &&
                first[1] === last[1];
            if (!isClosed) {
                pushIssue(
                    issues,
                    `${path}.polygons[${i}]`,
                    'GEO_AREA_RING_NOT_CLOSED',
                    'Polygon ring must be closed (first coordinate equals last).'
                );
            }
        }
    }

    return issues;
}
