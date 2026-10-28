import type { FormSubmission } from '@moteurio/types/Form.js';
import {
    eraseSubmission,
    getSubmissionForProject,
    listFormsForProject,
    listSubmissionRows,
    saveSubmissionForProject
} from '@moteurio/core/host.js';
import { readPolicy, ruleFor, type RetentionRule } from './policy.js';
import { appendLog } from './log.js';

export const ACTOR = { id: 'plugin:form-data-retention', name: 'Data retention policy' };

const DAY = 86_400_000;

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

/**
 * A submission with nothing left about the person, built from what may stay rather than from
 * what must go, so a field the engine adds later stays out until it's added here: the kept
 * answers, the date, the language, the campaign, the page without its query string, its status,
 * when it was read, and which actions ran and whether they worked.
 */
export function anonymised(s: FormSubmission, rule: RetentionRule, at: string): FormSubmission {
    const keep = new Set(rule.keepFields ?? []);
    const data = Object.fromEntries(Object.entries(s.data ?? {}).filter(([k]) => keep.has(k)));
    const { submittedAt, locale, page, campaign } = s.metadata;
    // utm_term and utm_content can be set per recipient: only the campaign itself stays.
    const kept = campaign && {
        ...(campaign.source && { source: campaign.source }),
        ...(campaign.medium && { medium: campaign.medium }),
        ...(campaign.campaign && { campaign: campaign.campaign })
    };
    return {
        id: s.id,
        formId: s.formId,
        projectId: s.projectId,
        data,
        metadata: {
            submittedAt,
            ...(locale && { locale }),
            ...(kept && Object.keys(kept).length && { campaign: kept }),
            // The page is kept for counts, without its query string (it can hold an email).
            ...(page && { page: page.split(/[?#]/)[0] }),
            ...(s.metadata.heldBy && { heldBy: s.metadata.heldBy })
        },
        // An error or a detail can quote the address it failed to send to, an entry holds the answers.
        actionResults: (s.actionResults ?? []).map(({ type, status }) => ({ type, status })),
        status: s.status,
        ...(s.readAt && { readAt: s.readAt }),
        ...(s.statusBeforeSpam && { statusBeforeSpam: s.statusBeforeSpam }),
        // Spam is still deleted on time.
        ...(s.spamAt && { spamAt: s.spamAt }),
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
    const report: SweepReport = { at, dryRun, forms: {} };

    for (const form of await listFormsForProject(projectId)) {
        const rule = ruleFor(policy, form.id);
        const forgetDays = policy.forgetAddressesAfterDays;
        if (!rule && forgetDays === undefined) continue;
        const counts: FormReport = { deleted: 0, anonymised: 0, addressesForgotten: 0 };
        // Every submission past its days is looked at, each time, not only those sent since the
        // last sweep: one restored from a backup or imported keeps its old date.
        const rows = await listSubmissionRows(projectId, form.id);

        const ruleCutoff = rule ? new Date(now - rule.keepDays * DAY).toISOString() : undefined;
        const handled = new Set<string>();
        if (rule && ruleCutoff) {
            for (const row of rows) {
                if (row.submittedAt >= ruleCutoff) continue;
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
        }

        if (forgetDays !== undefined) {
            const cutoff = new Date(now - forgetDays * DAY).toISOString();
            for (const row of rows) {
                if (handled.has(row.id)) continue;
                if (row.submittedAt >= cutoff) continue;
                const sub = await getSubmissionForProject(projectId, form.id, row.id);
                if (!sub || (sub.metadata.ip === undefined && sub.metadata.userAgent === undefined))
                    continue;
                counts.addressesForgotten++;
                if (dryRun) continue;
                const { ip: _ip, userAgent: _ua, ...metadata } = sub.metadata;
                await saveSubmissionForProject({ ...sub, metadata });
            }
        }

        report.forms[form.id] = { ...counts, ...(rule && { rule }) };
    }

    if (!dryRun) {
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
