import type { Field } from '@moteurio/types/Field.js';
import type { ValidationIssue } from '@moteurio/types/ValidationResult.js';
import { isPlainObject, pushIssue, validateLngLatPair } from './geoCommon.js';

export function validatePolylineField(value: unknown, field: Field, path: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (value === null || value === undefined) return issues;
    if (!isPlainObject(value)) {
        pushIssue(
            issues,
            path,
            'GEO_POLYLINE_INVALID_TYPE',
            'Expected an object with points: [ [lng,lat], ... ].',
            { value }
        );
        return issues;
    }

    const points = value.points;
    if (!Array.isArray(points)) {
        pushIssue(
            issues,
            `${path}.points`,
            'GEO_POLYLINE_POINTS_REQUIRED',
            'Expected points to be an array of [lng, lat].',
            { value: points }
        );
        return issues;
    }

    const minPoints =
        typeof field.options?.minPoints === 'number' && field.options.minPoints > 1
            ? field.options.minPoints
            : 2;
    if (points.length < minPoints) {
        pushIssue(
            issues,
            `${path}.points`,
            'GEO_POLYLINE_TOO_SHORT',
            `Polyline requires at least ${minPoints} points.`,
            { value: points.length }
        );
    }

    for (let i = 0; i < points.length; i += 1) {
        issues.push(...validateLngLatPair(points[i], `${path}.points[${i}]`));
    }
    return issues;
}
