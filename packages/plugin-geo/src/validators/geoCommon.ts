import type { ValidationIssue } from '@moteurio/types/ValidationResult.js';

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

export function pushIssue(
    issues: ValidationIssue[],
    path: string,
    code: string,
    message: string,
    context?: Record<string, unknown>
): void {
    issues.push({ type: 'error', code, message, path, context });
}

/** Validates a single [lng, lat] pair. */
export function validateLngLatPair(value: unknown, path: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!Array.isArray(value) || value.length !== 2) {
        pushIssue(
            issues,
            path,
            'GEO_POSITION_INVALID',
            'Expected [lng, lat] coordinate pair.',
            { value }
        );
        return issues;
    }
    const [lng, lat] = value;
    if (!isFiniteNumber(lng) || lng < -180 || lng > 180) {
        pushIssue(
            issues,
            `${path}[0]`,
            'GEO_POSITION_LNG_RANGE',
            'Longitude must be between -180 and 180.',
            { value: lng }
        );
    }
    if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
        pushIssue(
            issues,
            `${path}[1]`,
            'GEO_POSITION_LAT_RANGE',
            'Latitude must be between -90 and 90.',
            { value: lat }
        );
    }
    return issues;
}
