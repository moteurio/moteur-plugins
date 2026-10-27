import { getProjectJson, putProjectJson } from '@moteurio/core/host.js';

/**
 * How long a project keeps what visitors send, form by form. Kept in the project's workspace
 * (`.moteur/`, never in Git), with the plugin's state and log beside it.
 */

const DIR = '.moteur/plugin-form-data-retention/';
export const POLICY_KEY = `${DIR}policy.json`;
export const STATE_KEY = `${DIR}state.json`;
export const LOG_KEY = `${DIR}log.json`;

/** What happens to a submission once it's older than `keepDays`. */
export type RetentionRule = {
    keepDays: number;
    /** `delete`: gone for good. `anonymise`: kept for counts, without anything about the person. */
    then: 'delete' | 'anonymise';
    /** Anonymising: answers kept as they are, because they say nothing about the person (a topic). */
    keepFields?: string[];
};

export type RetentionPolicy = {
    /** For every form without its own rule. */
    default?: RetentionRule;
    /** A form's own rule; `null` keeps that form's submissions until someone deletes them. */
    forms?: Record<string, RetentionRule | null>;
    /** Forget visitors' IP address and browser this many days after they sent the form. */
    forgetAddressesAfterDays?: number;
    updatedAt?: string;
    updatedBy?: string;
};

/** Ten years: longer than any rule should need, short enough to catch a typo in days. */
const MAX_DAYS = 3650;

const isDays = (v: unknown, min: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= MAX_DAYS;

function checkRule(rule: unknown, where: string): RetentionRule {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule))
        throw new PolicyError(`${where} must be { keepDays, then }.`);
    const r = rule as Record<string, unknown>;
    if (!isDays(r.keepDays, 1))
        throw new PolicyError(`${where}.keepDays must be a whole number of days, 1 to ${MAX_DAYS}.`);
    if (r.then !== 'delete' && r.then !== 'anonymise')
        throw new PolicyError(`${where}.then must be "delete" or "anonymise".`);
    if (
        r.keepFields !== undefined &&
        (!Array.isArray(r.keepFields) || r.keepFields.some(f => typeof f !== 'string'))
    )
        throw new PolicyError(`${where}.keepFields must be a list of field ids.`);
    if (r.keepFields !== undefined && r.then !== 'anonymise')
        throw new PolicyError(`${where}.keepFields only applies when anonymising.`);
    return {
        keepDays: r.keepDays as number,
        then: r.then,
        ...(Array.isArray(r.keepFields) && r.keepFields.length && { keepFields: r.keepFields as string[] })
    };
}

export class PolicyError extends Error {
    readonly statusCode = 422;
    readonly code = 'RETENTION_POLICY_INVALID';
}

/** The policy as sent, checked: throws a PolicyError naming what's wrong. */
export function checkPolicy(input: unknown): RetentionPolicy {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new PolicyError('The policy must be an object.');
    const p = input as Record<string, unknown>;
    const out: RetentionPolicy = {};
    if (p.default !== undefined && p.default !== null) out.default = checkRule(p.default, 'default');
    if (p.forms !== undefined && p.forms !== null) {
        if (typeof p.forms !== 'object' || Array.isArray(p.forms))
            throw new PolicyError('forms must be rules by form id.');
        out.forms = {};
        for (const [formId, rule] of Object.entries(p.forms))
            out.forms[formId] = rule === null ? null : checkRule(rule, `forms.${formId}`);
    }
    if (p.forgetAddressesAfterDays !== undefined && p.forgetAddressesAfterDays !== null) {
        if (!isDays(p.forgetAddressesAfterDays, 0))
            throw new PolicyError(
                `forgetAddressesAfterDays must be a whole number of days, 0 to ${MAX_DAYS}.`
            );
        out.forgetAddressesAfterDays = p.forgetAddressesAfterDays as number;
    }
    return out;
}

/** The rule a form follows: its own, else the default, else none. */
export function ruleFor(policy: RetentionPolicy, formId: string): RetentionRule | undefined {
    const own = policy.forms?.[formId];
    if (own === null) return undefined;
    return own ?? policy.default;
}

export async function readPolicy(projectId: string): Promise<RetentionPolicy> {
    return (await getProjectJson<RetentionPolicy>(projectId, POLICY_KEY)) ?? {};
}

export async function writePolicy(
    projectId: string,
    policy: RetentionPolicy,
    by: string
): Promise<RetentionPolicy> {
    const stored = { ...policy, updatedAt: new Date().toISOString(), updatedBy: by };
    await putProjectJson(projectId, POLICY_KEY, stored);
    return stored;
}
