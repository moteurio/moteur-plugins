import type { Field } from '@moteurio/types/Field.js';
import type { ValidationIssue } from '@moteurio/types/ValidationResult.js';
import { isFiniteNumber, isPlainObject, pushIssue } from './geoCommon.js';

export function validateLocationField(
    value: unknown,
    _field: Field,
    path: string
): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (value === null || value === undefined) return issues;

    if (!isPlainObject(value)) {
        pushIssue(
            issues,
            path,
            'GEO_LOCATION_INVALID_TYPE',
            'Expected an object with lat and lng.',
            { value }
        );
        return issues;
    }

    const lat = value.lat;
    const lng = value.lng;
    if (!isFiniteNumber(lat)) {
        pushIssue(
            issues,
            `${path}.lat`,
            'GEO_LOCATION_LAT_REQUIRED',
            'Latitude must be a finite number.',
            { value: lat }
        );
    } else if (lat < -90 || lat > 90) {
        pushIssue(
            issues,
            `${path}.lat`,
            'GEO_LOCATION_LAT_RANGE',
            'Latitude must be between -90 and 90.',
            { value: lat }
        );
    }

    if (!isFiniteNumber(lng)) {
        pushIssue(
            issues,
            `${path}.lng`,
            'GEO_LOCATION_LNG_REQUIRED',
            'Longitude must be a finite number.',
            { value: lng }
        );
    } else if (lng < -180 || lng > 180) {
        pushIssue(
            issues,
            `${path}.lng`,
            'GEO_LOCATION_LNG_RANGE',
            'Longitude must be between -180 and 180.',
            { value: lng }
        );
    }

    return issues;
}
