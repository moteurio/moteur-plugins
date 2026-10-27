/**
 * Form data retention: how long each form keeps what visitors send, and what a person can ask
 * for (a copy of everything they sent, or to be forgotten). Routes under
 * /projects/:projectId/retention, for project admins.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { hasRole } from '@moteurio/types';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import { getProjectById, listFormsForProject, listSubmissionRows, loadProjects } from '@moteurio/core/host.js';
import { checkPolicy, readPolicy, ruleFor, writePolicy } from './policy.js';
import { appendLog, readLog } from './log.js';
import { sweepProject } from './sweep.js';
import { checkPerson, erasePerson, exportPerson, findPerson } from './people.js';
import { openapi } from './openapi.js';

export { checkPolicy, ruleFor, type RetentionPolicy, type RetentionRule } from './policy.js';
export { sweepProject, anonymised, type SweepReport } from './sweep.js';
export { checkPerson, findPerson, exportPerson, erasePerson, sentBy, reference } from './people.js';

const PLUGIN_ID = 'form-data-retention';

export const manifest: PluginManifest = {
    id: PLUGIN_ID,
    label: 'Form data retention',
    description:
        'How long each form keeps what visitors send, and a person’s copy or erasure on request (GDPR, Law 25)',
    source: 'opensource',
    kind: 'optional',
    scope: 'project',
    categories: ['forms', 'privacy'],
    contributes: {
        api: { mounts: ['/projects'], openApi: true },
        commands: {
            cli: ['retention show', 'retention run', 'retention export', 'retention erase'],
            mcp: ['retention_show', 'retention_run', 'retention_export', 'retention_erase']
        }
    }
};

let isEnabled: (projectId: string) => Promise<boolean> = async projectId => {
    const list = (await getProjectById(projectId))?.plugins;
    return list == null || list.includes(PLUGIN_ID);
};

/** Minutes between sweeps (`RETENTION_SWEEP_MINUTES`, default 60; 0 turns them off). */
function sweepMinutes(): number {
    const raw = process.env.RETENTION_SWEEP_MINUTES;
    const n = raw === undefined || raw === '' ? 60 : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 60;
}

/** Every project with the plugin on and a policy, once. A failing project doesn't stop the rest. */
export async function sweepAll(now = Date.now()): Promise<void> {
    for (const project of loadProjects()) {
        try {
            if (!(await isEnabled(project.id))) continue;
            const policy = await readPolicy(project.id);
            if (!policy.default && !policy.forms && policy.forgetAddressesAfterDays === undefined)
                continue;
            await sweepProject(project.id, { now });
        } catch (err) {
            console.warn(`[form-data-retention] ${project.id}:`, err instanceof Error ? err.message : err);
        }
    }
}

let timer: ReturnType<typeof setInterval> | undefined;

export function init(ctx: PluginContext): void {
    isEnabled = projectId => ctx.isPluginEnabledForProject(projectId, PLUGIN_ID);
    const project = { name: 'project', description: 'Project id', aliases: ['projectId'], in: 'none' as const };
    const person = [
        { name: 'email', description: 'The email they wrote in the form', in: 'body' as const },
        { name: 'phone', description: 'Or the phone number they wrote', in: 'body' as const }
    ];
    ctx.registerCommand({
        group: 'retention',
        name: 'show',
        summary: 'How long each form keeps submissions, and how many are due',
        args: [project],
        http: 'GET /projects/{project}/retention',
        readOnly: true
    });
    ctx.registerCommand({
        group: 'retention',
        name: 'run',
        summary: 'Apply the retention policy now (--dry-run counts without changing anything)',
        args: [
            project,
            { name: 'dry-run', type: 'boolean', description: 'Only count', in: 'query', key: 'dryRun' }
        ],
        http: 'POST /projects/{project}/retention/run',
        destructive: true
    });
    ctx.registerCommand({
        group: 'retention',
        name: 'export',
        summary: 'Everything a person sent through the forms, as JSON (their right of access)',
        args: [project, ...person],
        http: 'POST /projects/{project}/retention/people/export',
        body: 'json',
        readOnly: true
    });
    ctx.registerCommand({
        group: 'retention',
        name: 'erase',
        summary: 'Delete everything a person sent through the forms, for good (their right to erasure)',
        args: [project, ...person],
        http: 'POST /projects/{project}/retention/people/erase',
        body: 'json',
        destructive: true
    });

    clearInterval(timer);
    const minutes = sweepMinutes();
    if (minutes > 0) {
        timer = setInterval(() => void sweepAll(), minutes * 60_000);
        timer.unref?.();
        // A first sweep soon after start, once the host is up.
        setTimeout(() => void sweepAll(), 60_000).unref?.();
    }
}

function createRouter(routeCtx: PluginRouteContext): Router {
    const router = Router({ mergeParams: true });
    const project = (req: Request) => String(req.params.projectId);

    // Project admins only, on projects that have the plugin.
    const admin = (req: Request, res: Response, next: NextFunction) =>
        routeCtx.requireProjectAccess(req, res, async () => {
            if (!hasRole((req as { user?: Parameters<typeof hasRole>[0] }).user, 'admin')) {
                res.status(403).json({ error: 'Project admin access required' });
                return;
            }
            if (!(await isEnabled(project(req)))) {
                res.status(404).json({ error: 'Form data retention is not enabled for this project.' });
                return;
            }
            next();
        });
    const who = (req: Request) => {
        const user = (req as { user?: { id: string; name?: string } }).user;
        return user?.name ?? user?.id ?? 'someone';
    };
    const fail = (res: Response, err: unknown) => {
        const e = err as { statusCode?: number; code?: string; message?: string };
        res.status(e.statusCode ?? 500).json({
            error: e.statusCode ? e.message : 'Retention failed',
            ...(e.code && { code: e.code })
        });
    };

    router.get('/retention', admin, async (req, res) => {
        try {
            const projectId = project(req);
            const policy = await readPolicy(projectId);
            const now = Date.now();
            const forms = [];
            for (const form of await listFormsForProject(projectId)) {
                const rows = await listSubmissionRows(projectId, form.id);
                const rule = ruleFor(policy, form.id);
                const cutoff = rule && new Date(now - rule.keepDays * 86_400_000).toISOString();
                const oldest = rows.reduce<string | undefined>(
                    (o, r) => (!o || r.submittedAt < o ? r.submittedAt : o),
                    undefined
                );
                forms.push({
                    id: form.id,
                    label: form.label,
                    rule: rule ?? null,
                    submissions: rows.length,
                    ...(oldest && { oldest }),
                    // Anonymised ones stay past their date: this counts what's past it.
                    pastKeepDays: cutoff ? rows.filter(r => r.submittedAt < cutoff).length : 0
                });
            }
            res.json({ policy, forms });
        } catch (err) {
            fail(res, err);
        }
    });

    router.put('/retention', admin, async (req, res) => {
        try {
            const policy = await writePolicy(project(req), checkPolicy(req.body), who(req));
            await appendLog(project(req), { at: policy.updatedAt!, kind: 'policy', by: who(req) });
            res.json({ policy });
        } catch (err) {
            fail(res, err);
        }
    });

    router.post('/retention/run', admin, async (req, res) => {
        try {
            const dryRun = ['1', 'true'].includes(String(req.query.dryRun ?? req.body?.dryRun ?? ''));
            res.json(await sweepProject(project(req), { dryRun }));
        } catch (err) {
            fail(res, err);
        }
    });

    router.get('/retention/log', admin, async (req, res) => {
        try {
            const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);
            res.json({ entries: (await readLog(project(req))).slice(0, limit) });
        } catch (err) {
            fail(res, err);
        }
    });

    // A person is given in the body, never in the address: addresses end up in logs.
    router.post('/retention/people/find', admin, async (req, res) => {
        try {
            const found = await findPerson(project(req), checkPerson(req.body));
            res.json({
                submissions: found.map(f => ({
                    formId: f.formId,
                    formLabel: f.formLabel,
                    id: f.submission.id,
                    submittedAt: f.submission.metadata?.submittedAt,
                    status: f.submission.status
                }))
            });
        } catch (err) {
            fail(res, err);
        }
    });

    router.post('/retention/people/export', admin, async (req, res) => {
        try {
            const out = await exportPerson(project(req), checkPerson(req.body), who(req));
            res.set('Cache-Control', 'no-store');
            res.json(out);
        } catch (err) {
            fail(res, err);
        }
    });

    router.post('/retention/people/erase', admin, async (req, res) => {
        try {
            res.json(await erasePerson(project(req), checkPerson(req.body), who(req)));
        } catch (err) {
            fail(res, err);
        }
    });

    return router;
}

export function getRoutes(ctx: PluginRouteContext): PluginRouteContribution {
    return { path: '/projects/:projectId', router: createRouter(ctx), openapi: { paths: openapi } };
}

export default { manifest, init, getRoutes };
