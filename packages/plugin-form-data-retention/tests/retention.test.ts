import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { AddressInfo } from 'net';
import express from 'express';
import type { FormSubmission } from '@moteurio/types/Form.js';
import { getSubmissionForProject, listSubmissionRows, putProjectJson, saveSubmissionForProject } from '@moteurio/core/host.js';
import { checkPolicy, ruleFor } from '../src/policy.js';
import { sweepProject } from '../src/sweep.js';
import { checkPerson, erasePerson, exportPerson, findPerson, reference } from '../src/people.js';
import { readLog } from '../src/log.js';
import { writePolicy } from '../src/policy.js';
import plugin from '../src/index.js';

const projectId = 'retention-test';
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

let tempDir: string;
let projectDir: string;
let originalDataRoot: string | undefined;
let originalJwtSecret: string | undefined;

async function form(id: string) {
    await putProjectJson(projectId, `forms/${id}/form.json`, {
        id,
        label: id === 'contact' ? 'Contact' : 'Newsletter',
        status: 'active',
        fields: {
            email: { type: 'core/email', label: 'Email' },
            phone: { type: 'core/phone', label: 'Phone' },
            topic: { type: 'core/text', label: 'Topic' }
        },
        createdAt: '',
        updatedAt: ''
    });
}

let n = 0;
async function sent(formId: string, daysAgo: number, data: Record<string, unknown>) {
    const sub: FormSubmission = {
        id: `s${String(++n).padStart(6, '0')}`,
        formId,
        projectId,
        data,
        metadata: {
            submittedAt: ago(daysAgo),
            ip: '203.0.113.9',
            userAgent: 'Firefox',
            referrer: 'https://news.example/?ref=letter',
            page: 'https://site.example/contact?utm_source=letter'
        },
        actionResults: [],
        status: 'processed'
    };
    await saveSubmissionForProject(sub);
    return sub;
}

async function allText(dir: string): Promise<string> {
    let out = '';
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out += await allText(p);
        else out += await fs.readFile(p, 'utf8').catch(() => '');
    }
    return out;
}

beforeEach(async () => {
    n = 0;
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'moteur-retention-'));
    projectDir = path.join(tempDir, 'data', 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(
        path.join(projectDir, 'project.json'),
        JSON.stringify({ id: projectId, label: 'Retention', defaultLocale: 'en', users: ['u1'] })
    );
    originalDataRoot = process.env.DATA_ROOT;
    process.env.DATA_ROOT = tempDir;
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-jwt-secret';
    await form('contact');
    await form('newsletter');
});

afterEach(async () => {
    if (originalDataRoot !== undefined) process.env.DATA_ROOT = originalDataRoot;
    else delete process.env.DATA_ROOT;
    if (originalJwtSecret !== undefined) process.env.JWT_SECRET = originalJwtSecret;
    else delete process.env.JWT_SECRET;
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
});

describe('policy', () => {
    it('takes a default, rules by form, and a form left out on purpose', () => {
        const policy = checkPolicy({
            default: { keepDays: 365, then: 'delete' },
            forms: { newsletter: null, contact: { keepDays: 30, then: 'anonymise', keepFields: ['topic'] } },
            forgetAddressesAfterDays: 7
        });
        expect(ruleFor(policy, 'contact')).toEqual({ keepDays: 30, then: 'anonymise', keepFields: ['topic'] });
        expect(ruleFor(policy, 'newsletter')).toBeUndefined();
        expect(ruleFor(policy, 'other')).toEqual({ keepDays: 365, then: 'delete' });
    });

    it('names what doesn’t fit', () => {
        expect(() => checkPolicy({ default: { keepDays: 0, then: 'delete' } })).toThrow('keepDays');
        expect(() => checkPolicy({ default: { keepDays: 30, then: 'archive' } })).toThrow('"delete" or "anonymise"');
        expect(() => checkPolicy({ default: { keepDays: 30, then: 'delete', keepFields: ['a'] } })).toThrow(
            'only applies when anonymising'
        );
    });
});

describe('sweep', () => {
    it('deletes what is past its days, keeps the rest, and a dry run changes nothing', async () => {
        await writePolicy(projectId, { default: { keepDays: 30, then: 'delete' }, forms: { newsletter: null } }, 'Louise');
        await sent('contact', 40, { email: 'old@example.com' });
        await sent('contact', 5, { email: 'new@example.com' });
        await sent('newsletter', 400, { email: 'kept@example.com' });

        const dry = await sweepProject(projectId, { dryRun: true });
        expect(dry.forms.contact.deleted).toBe(1);
        expect(await listSubmissionRows(projectId, 'contact')).toHaveLength(2);

        const real = await sweepProject(projectId);
        expect(real.forms.contact.deleted).toBe(1);
        expect(real.forms.newsletter).toBeUndefined();
        expect((await listSubmissionRows(projectId, 'contact')).map(r => r.id)).toEqual(['s000002']);
        expect(await listSubmissionRows(projectId, 'newsletter')).toHaveLength(1);
        const [entry] = await readLog(projectId);
        expect(entry).toMatchObject({ kind: 'sweep', forms: { contact: { deleted: 1 } } });
    });

    it('anonymises: keeps the chosen answers and the page, nothing about the person', async () => {
        await writePolicy(
            projectId,
            { forms: { contact: { keepDays: 30, then: 'anonymise', keepFields: ['topic'] } } },
            'Louise'
        );
        const old = await sent('contact', 40, { email: 'lise@example.com', topic: 'Sales' });
        expect((await sweepProject(projectId)).forms.contact.anonymised).toBe(1);
        const after = await getSubmissionForProject(projectId, 'contact', old.id);
        expect(after?.data).toEqual({ topic: 'Sales' });
        expect(after?.metadata).toEqual({
            submittedAt: old.metadata.submittedAt,
            page: 'https://site.example/contact'
        });
        expect((after as { anonymisedAt?: string }).anonymisedAt).toBeDefined();
        // Done once: the next sweep leaves it as it is.
        expect((await sweepProject(projectId)).forms.contact.anonymised).toBe(0);
    });

    it('anonymises everything else that could say who sent it', async () => {
        await writePolicy(
            projectId,
            { forms: { contact: { keepDays: 30, then: 'anonymise', keepFields: ['topic'] } } },
            'Louise'
        );
        const old: FormSubmission = {
            id: 's900001',
            formId: 'contact',
            projectId,
            data: { email: 'lise@example.com', topic: 'Sales' },
            metadata: {
                submittedAt: ago(40),
                ip: '203.0.113.9',
                userAgent: 'Firefox',
                locale: 'fr',
                referrer: 'https://news.example/?ref=letter',
                page: 'https://site.example/contact?email=lise@example.com',
                campaign: { source: 'letter', medium: 'email', campaign: 'spring', term: 'lise', content: 'lise@example.com' },
                fillSeconds: 12,
                recaptchaScore: 0.9,
                screenedBy: 'spam-check',
                screenNote: 'Looked fine for lise@example.com'
            },
            actionResults: [
                { type: 'email', status: 'failed', error: '550 No such user: lise@example.com' },
                { type: 'entry', status: 'success', entryId: 'lead-42' },
                { type: 'sheets:append', status: 'success', detail: 'Row 42 added: lise@example.com' }
            ],
            status: 'processed',
            readAt: ago(39),
            readBy: 'Louise'
        };
        await saveSubmissionForProject(old);
        await sweepProject(projectId);
        const after = await getSubmissionForProject(projectId, 'contact', old.id);
        expect(after).toEqual({
            id: old.id,
            formId: 'contact',
            projectId,
            data: { topic: 'Sales' },
            metadata: {
                submittedAt: old.metadata.submittedAt,
                locale: 'fr',
                campaign: { source: 'letter', medium: 'email', campaign: 'spring' },
                page: 'https://site.example/contact'
            },
            actionResults: [
                { type: 'email', status: 'failed' },
                { type: 'entry', status: 'success' },
                { type: 'sheets:append', status: 'success' }
            ],
            status: 'processed',
            readAt: old.readAt,
            anonymisedAt: expect.any(String)
        });
        expect(JSON.stringify(after)).not.toContain('lise');
    });

    it('finds a submission restored or imported after a sweep, with its old date', async () => {
        await writePolicy(
            projectId,
            { forms: { contact: { keepDays: 30, then: 'anonymise' } }, forgetAddressesAfterDays: 7 },
            'Louise'
        );
        const first = await sent('contact', 40, { email: 'lise@example.com' });
        await sweepProject(projectId);

        // Back from a backup as it was before, and two imported with their first dates.
        await saveSubmissionForProject(first);
        const imported = await sent('contact', 60, { email: 'marc@example.com' });
        const recent = await sent('newsletter', 10, { email: 'zoe@example.com' });

        const report = await sweepProject(projectId);
        expect(report.forms.contact.anonymised).toBe(2);
        expect(report.forms.newsletter.addressesForgotten).toBe(1);
        for (const id of [first.id, imported.id])
            expect((await getSubmissionForProject(projectId, 'contact', id))?.data).toEqual({});
        expect((await getSubmissionForProject(projectId, 'newsletter', recent.id))?.metadata.ip).toBeUndefined();
    });

    it('forgets addresses after their days, and keeps the answers', async () => {
        await writePolicy(projectId, { forgetAddressesAfterDays: 7 }, 'Louise');
        const old = await sent('contact', 10, { email: 'lise@example.com' });
        const recent = await sent('contact', 2, { email: 'marc@example.com' });
        expect((await sweepProject(projectId)).forms.contact.addressesForgotten).toBe(1);
        const after = await getSubmissionForProject(projectId, 'contact', old.id);
        expect(after?.metadata.ip).toBeUndefined();
        expect(after?.metadata.userAgent).toBeUndefined();
        expect(after?.data.email).toBe('lise@example.com');
        expect((await getSubmissionForProject(projectId, 'contact', recent.id))?.metadata.ip).toBe('203.0.113.9');
    });
});

describe('a person’s requests', () => {
    it('finds a person by email, whatever the case, or by phone, however it is written', async () => {
        await sent('contact', 3, { email: 'Lise@Example.com', topic: 'x' });
        await sent('newsletter', 2, { email: 'marc@example.com', phone: '+1 514 555-0199' });
        await sent('contact', 1, { email: 'other@example.com' });
        expect((await findPerson(projectId, checkPerson({ email: ' lise@example.COM ' }))).map(f => f.formId)).toEqual([
            'contact'
        ]);
        expect((await findPerson(projectId, checkPerson({ phone: '(514) 555 0199' }))).map(f => f.formId)).toEqual([
            'newsletter'
        ]);
        expect(() => checkPerson({ phone: '555' })).toThrow('7 digits');
    });

    it('exports what they sent, and logs the request without who asked', async () => {
        await sent('contact', 3, { email: 'lise@example.com', topic: 'Sales' });
        const out = await exportPerson(projectId, checkPerson({ email: 'lise@example.com' }), 'Louise');
        expect(out.submissions).toHaveLength(1);
        expect(out.submissions[0]).toMatchObject({
            form: { id: 'contact', label: 'Contact' },
            answers: { email: 'lise@example.com', topic: 'Sales' },
            sentFrom: { ip: '203.0.113.9' }
        });
        const [entry] = await readLog(projectId);
        expect(entry).toMatchObject({ kind: 'export', submissions: 1, by: 'Louise', reference: out.reference });
        expect(JSON.stringify(await readLog(projectId))).not.toContain('lise@');
    });

    it('erases everything they sent, and nothing on disk still holds their email', async () => {
        await sent('contact', 3, { email: 'lise@example.com' });
        await sent('newsletter', 2, { email: 'LISE@example.com' });
        await sent('contact', 1, { email: 'marc@example.com' });
        const receipt = await erasePerson(projectId, checkPerson({ email: 'lise@example.com' }), 'Louise');
        expect(receipt).toMatchObject({ erased: 2, forms: { contact: 1, newsletter: 1 } });
        expect(await listSubmissionRows(projectId, 'contact')).toHaveLength(1);
        expect(await listSubmissionRows(projectId, 'newsletter')).toHaveLength(0);
        expect((await allText(projectDir)).toLowerCase()).not.toContain('lise@example.com');
        // The same person asked again gives the same reference.
        const again = await erasePerson(projectId, checkPerson({ email: 'Lise@example.com' }), 'Louise');
        expect(again).toMatchObject({ erased: 0, reference: receipt.reference });
    });

    it('signs references with a key of the project’s, so an email can’t be guessed from one', () => {
        const lise = checkPerson({ email: 'lise@example.com' });
        const ref = reference(projectId, lise);
        expect(ref).toMatch(/^[0-9a-f]{16}$/);
        const plain = crypto.createHash('sha256').update(`${projectId}|lise@example.com|`).digest('hex');
        expect(plain.startsWith(ref)).toBe(false);
        expect(reference('another-project', lise)).not.toBe(ref);
        // Without the server's secret, nobody can work one out.
        process.env.JWT_SECRET = 'another-secret';
        expect(reference(projectId, lise)).not.toBe(ref);
        delete process.env.JWT_SECRET;
        expect(() => reference(projectId, lise)).toThrow('JWT_SECRET');
    });
});

describe('routes', () => {
    async function serve(role: string) {
        const app = express();
        app.use(express.json());
        const pass = (req: any, _res: any, next: any) => {
            req.user = { id: 'u1', name: 'Louise', roles: [role] };
            next();
        };
        const routes = plugin.getRoutes!({ requireAuth: pass, requireProjectAccess: pass, requireOperator: pass });
        app.use(routes.path, routes.router);
        const server = app.listen(0);
        const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/projects/${projectId}`;
        return { base, close: () => server.close() };
    }

    it('lets only project admins in', async () => {
        const { base, close } = await serve('editor');
        try {
            const res = await fetch(`${base}/retention`);
            expect(res.status).toBe(403);
        } finally {
            close();
        }
    });

    it('sets a policy, refuses a bad one, and finds a person from the body', async () => {
        await sent('contact', 3, { email: 'lise@example.com' });
        const { base, close } = await serve('admin');
        try {
            const put = (body: unknown) =>
                fetch(`${base}/retention`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            expect((await put({ default: { keepDays: -1, then: 'delete' } })).status).toBe(422);
            expect((await put({ default: { keepDays: 1, then: 'delete' } })).status).toBe(200);
            const show = await (await fetch(`${base}/retention`)).json();
            expect(show.forms.find((f: { id: string }) => f.id === 'contact')).toMatchObject({
                submissions: 1,
                pastKeepDays: 1
            });
            const found = await (
                await fetch(`${base}/retention/people/find`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'lise@example.com' })
                })
            ).json();
            expect(found.submissions).toHaveLength(1);
            const dry = await (await fetch(`${base}/retention/run?dryRun=1`, { method: 'POST' })).json();
            expect(dry).toMatchObject({ dryRun: true, forms: { contact: { deleted: 1 } } });
        } finally {
            close();
        }
    });
});
