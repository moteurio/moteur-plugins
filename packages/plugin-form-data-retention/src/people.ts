import crypto from 'crypto';
import type { FormSubmission } from '@moteurio/types/Form.js';
import {
    eraseSubmission,
    getSubmissionForProject,
    listFormsForProject,
    listSubmissionRows
} from '@moteurio/core/host.js';
import { appendLog } from './log.js';
import { ACTOR } from './sweep.js';

/**
 * A person asks what a project holds about them, or to be forgotten (GDPR articles 15 and 17,
 * Quebec's Law 25). They are found by the email or phone number they wrote in any form.
 */
export type Person = { email?: string; phone?: string };

export class PersonError extends Error {
    readonly statusCode = 400;
    readonly code = 'PERSON_REQUIRED';
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: string) => v.replace(/\D/g, '');

/** The person as given, cleaned up: throws when neither an email nor a phone is usable. */
export function checkPerson(input: unknown): Person {
    const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const email = typeof p.email === 'string' ? p.email.trim().toLowerCase() : '';
    const phone = typeof p.phone === 'string' ? digits(p.phone) : '';
    const out: Person = {};
    if (email && EMAIL.test(email)) out.email = email;
    // Seven digits at least: shorter would find strangers.
    if (phone.length >= 7) out.phone = phone;
    if (!out.email && !out.phone)
        throw new PersonError('Give the person’s email, or a phone number of 7 digits or more.');
    return out;
}

/** Every text an answer holds: lists and addresses included. */
function texts(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(texts);
    if (value && typeof value === 'object') return Object.values(value).flatMap(texts);
    return [];
}

/** Whether a submission holds this person's email or phone, in any answer. */
export function sentBy(s: FormSubmission, person: Person): boolean {
    return texts(s.data).some(t => {
        if (person.email && t.trim().toLowerCase() === person.email) return true;
        if (person.phone) {
            const d = digits(t);
            // +1 514 555 0199 and (514) 555-0199 are the same number.
            return d.length >= 7 && (d.endsWith(person.phone) || person.phone.endsWith(d));
        }
        return false;
    });
}

export type Found = { formId: string; formLabel: string; submission: FormSubmission };

/** Everything this person sent, in every form, oldest first. */
export async function findPerson(projectId: string, person: Person): Promise<Found[]> {
    const found: Found[] = [];
    for (const form of await listFormsForProject(projectId)) {
        for (const row of await listSubmissionRows(projectId, form.id)) {
            const sub = await getSubmissionForProject(projectId, form.id, row.id);
            if (sub && sentBy(sub, person))
                found.push({ formId: form.id, formLabel: form.label, submission: sub });
        }
    }
    return found.sort((a, b) =>
        (a.submission.metadata?.submittedAt ?? '').localeCompare(b.submission.metadata?.submittedAt ?? '')
    );
}

/**
 * A reference for a request that says nothing by itself: the same person, asked again in this
 * project, gives the same one. So the log can prove a request was met without keeping who asked.
 */
export function reference(projectId: string, person: Person): string {
    const key = [person.email ?? '', person.phone ?? ''].join('|');
    return crypto.createHash('sha256').update(`${projectId}|${key}`).digest('hex').slice(0, 16);
}

/** What a person is given: their answers and what came with them, nothing about the team. */
export async function exportPerson(projectId: string, person: Person, by: string) {
    const found = await findPerson(projectId, person);
    const ref = reference(projectId, person);
    await appendLog(projectId, {
        at: new Date().toISOString(),
        kind: 'export',
        reference: ref,
        submissions: found.length,
        by
    });
    return {
        reference: ref,
        generatedAt: new Date().toISOString(),
        submissions: found.map(({ formId, formLabel, submission: s }) => ({
            form: { id: formId, label: formLabel },
            id: s.id,
            submittedAt: s.metadata?.submittedAt,
            answers: s.data,
            sentFrom: {
                ...(s.metadata?.page && { page: s.metadata.page }),
                ...(s.metadata?.referrer && { referrer: s.metadata.referrer }),
                ...(s.metadata?.ip && { ip: s.metadata.ip }),
                ...(s.metadata?.userAgent && { browser: s.metadata.userAgent }),
                ...(s.metadata?.locale && { language: s.metadata.locale })
            }
        }))
    };
}

/** Delete everything this person sent, for good. Returns a receipt to send them. */
export async function erasePerson(projectId: string, person: Person, by: string) {
    const found = await findPerson(projectId, person);
    for (const { formId, submission } of found)
        await eraseSubmission(projectId, formId, submission.id, {
            id: ACTOR.id,
            name: `${ACTOR.name} (erase request, by ${by})`
        });
    const ref = reference(projectId, person);
    const at = new Date().toISOString();
    await appendLog(projectId, { at, kind: 'erase', reference: ref, submissions: found.length, by });
    const forms: Record<string, number> = {};
    for (const f of found) forms[f.formId] = (forms[f.formId] ?? 0) + 1;
    return { reference: ref, erasedAt: at, erased: found.length, forms };
}
