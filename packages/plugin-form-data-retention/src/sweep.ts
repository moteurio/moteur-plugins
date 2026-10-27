import type { FormSubmission } from '@moteurio/types/Form.js';
import {
    eraseSubmission,
    getProjectJson,
    getSubmissionForProject,
    listFormsForProject,
    listSubmissionRows,
    putProjectJson,
    saveSubmissionForProject
} from '@moteurio/core/host.js';
import { readPolicy, ruleFor, STATE_KEY, type RetentionRule } from './policy.js';
import { appendLog } from './log.js';

export const ACTOR = { id: 'plugin:form-data-retention', name: 'Data retention policy' };

const DAY = 86_400_000;

/**
 * How far each form has been handled: everything sent before `anonymisedThrough` is already
 * anonymised, and before `addressesForgottenThrough` has no address. So a sweep only opens
 * what changed since the last one.
 */
type State = {
    forms?: Record<string, { anonymisedThrough?: string; addressesForgottenThrough?: string }>;
};

export type FormReport = {
    deleted: number;
    anonymised: number;
    addressesForgotten: number;
};

export type SweepReport = {
    at: string;
    dryRun: boolean;
    forms: Record<string, FormReport & { rule?: RetentionRule }>;
};

/** A submission with nothing left about the person: only the kept answers, no address. */
export function anonymised(s: FormSubmission, rule: RetentionRule, at: string): FormSubmission {
    const keep = new Set(rule.keepFields ?? []);
    const data = Object.fromEntries(Object.entries(s.data ?? {}).filter(([k]) => keep.has(k)));
    const { ip: _ip, userAgent: _ua, referrer: _ref, page, ...metadata } = s.metadata;
    return {
        ...s,
        data,
        metadata: {
            ...metadata,
            // The page is kept for counts, without its query string (it can hold an email).
            ...(page && { page: page.split(/[?#]/)[0] })
        },
        anonymisedAt: at
    } as FormSubmission;
}

/** Apply the project's policy now. A dry run counts what would change and changes nothing. */
export async function sweepProject(
    projectId: string,
    options: { now?: number; dryRun?: boolean } = {}
): Promise<SweepReport> {
    const now = options.now ?? Date.now();
    const at = new Date(now).toISOString();
    const dryRun = options.dryRun === true;
    const policy = await readPolicy(projectId);
    const state = (await getProjectJson<State>(projectId, STATE_KEY)) ?? {};
    const forms: NonNullable<State['forms']> = { ...state.forms };
    const report: SweepReport = { at, dryRun, forms: {} };

    for (const form of await listFormsForProject(projectId)) {
        const rule = ruleFor(policy, form.id);
        const forgetDays = policy.forgetAddressesAfterDays;
        if (!rule && forgetDays === undefined) continue;
        const done = forms[form.id] ?? {};
        const counts: FormReport = { deleted: 0, anonymised: 0, addressesForgotten: 0 };
        const rows = await listSubmissionRows(projectId, form.id);

        const ruleCutoff = rule ? new Date(now - rule.keepDays * DAY).toISOString() : undefined;
        const handled = new Set<string>();
        if (rule && ruleCutoff) {
            const since = rule.then === 'anonymise' ? (done.anonymisedThrough ?? '') : '';
            for (const row of rows) {
                if (row.submittedAt >= ruleCutoff || row.submittedAt < since) continue;
                handled.add(row.id);
                if (rule.then === 'delete') {
                    counts.deleted++;
                    if (!dryRun) await eraseSubmission(projectId, form.id, row.id, ACTOR);
                    continue;
                }
                const sub = await getSubmissionForProject(projectId, form.id, row.id);
                if (!sub || (sub as { anonymisedAt?: string }).anonymisedAt) continue;
                counts.anonymised++;
                if (!dryRun) await saveSubmissionForProject(anonymised(sub, rule, at));
            }
            if (!dryRun && rule.then === 'anonymise')
                forms[form.id] = { ...forms[form.id], anonymisedThrough: ruleCutoff };
        }

        if (forgetDays !== undefined) {
            const cutoff = new Date(now - forgetDays * DAY).toISOString();
            const since = done.addressesForgottenThrough ?? '';
            for (const row of rows) {
                if (handled.has(row.id)) continue;
                if (row.submittedAt >= cutoff || row.submittedAt < since) continue;
                const sub = await getSubmissionForProject(projectId, form.id, row.id);
                if (!sub || (sub.metadata.ip === undefined && sub.metadata.userAgent === undefined))
                    continue;
                counts.addressesForgotten++;
                if (dryRun) continue;
                const { ip: _ip, userAgent: _ua, ...metadata } = sub.metadata;
                await saveSubmissionForProject({ ...sub, metadata });
            }
            if (!dryRun)
                forms[form.id] = { ...forms[form.id], addressesForgottenThrough: cutoff };
        }

        report.forms[form.id] = { ...counts, ...(rule && { rule }) };
    }

    if (!dryRun) {
        await putProjectJson(projectId, STATE_KEY, { forms } satisfies State);
        const changed = Object.fromEntries(
            Object.entries(report.forms)
                .filter(([, c]) => c.deleted || c.anonymised || c.addressesForgotten)
                .map(([id, c]) => [
                    id,
                    { deleted: c.deleted, anonymised: c.anonymised, addressesForgotten: c.addressesForgotten }
                ])
        );
        if (Object.keys(changed).length) await appendLog(projectId, { at, kind: 'sweep', forms: changed });
    }
    return report;
}
