import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import '@moteurio/core/fields/index.js';
import '@moteurio/core/assets/index.js';
import { initRepo } from '@moteurio/core/git/index.js';
import { gitIdle } from '@moteurio/core/git/gitService.js';
import { registerContentCommitHook } from '@moteurio/core/git/contentCommitHook.js';
import { importBundle } from '@moteurio/core/imports/importBundle.js';
import { adaptBundleToLanguages } from '@moteurio/core/imports/bundleLanguages.js';
import { resolveAllUrls } from '@moteurio/core/pages.js';
import type { User } from '@moteurio/types/User.js';
import { projectBlueprints } from '../src/data/projects/index.js';

// The import starts a radar scan it doesn't wait for: not this test's subject.
vi.mock('@moteurio/core/radar/index.js', () => ({ runFullScan: vi.fn(async () => undefined) }));

registerContentCommitHook();
const admin = {
    id: 'u1',
    name: 'Ada',
    isActive: true,
    roles: ['admin', 'developer'],
    projects: ['p']
} as User;

describe('the project blueprints', () => {
    let root: string;
    // As a project made from a blueprint gets it: fitted to its languages.
    const bundleFor = (blueprint: (typeof projectBlueprints)[number], languages: string[]) =>
        adaptBundleToLanguages(blueprint.bundle!, blueprint.languages ?? ['en'], {
            defaultLocale: languages[0]!,
            locales: languages.slice(1)
        });
    const project = async (languages: string[]) => {
        const dir = path.join(root, 'data', 'projects', 'p');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
            path.join(dir, 'project.json'),
            JSON.stringify({
                id: 'p',
                label: 'P',
                defaultLocale: languages[0],
                supportedLocales: languages.slice(1),
                users: ['u1']
            })
        );
        await initRepo(dir);
    };
    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'moteur-blueprints-'));
        vi.stubEnv('DATA_ROOT', root);
        vi.stubEnv('STATIC_ASSETS_BASE_URL', 'http://localhost:3000');
    });
    afterEach(async () => {
        await gitIdle();
        vi.unstubAllEnvs();
        fs.rmSync(root, { recursive: true, force: true });
    });

    for (const blueprint of projectBlueprints.filter(b => b.bundle)) {
        it(`${blueprint.id}: imports cleanly into an English and French project, live`, async () => {
            await project(['en', 'fr']);
            const out = await importBundle(admin, 'p', bundleFor(blueprint, ['en', 'fr']));
            expect(out.issues).toEqual([]);
            expect(out.status).toBe('done');
            // Nothing left out on the way (a picture, a value the schema doesn't have).
            // (Links in HTML becoming page links is the one note expected.)
            expect((out.notes ?? []).filter(n => !/lead to a page/.test(n.message))).toEqual([]);
            expect(out.items.every(i => i.action === 'create')).toBe(true);
            await gitIdle();
            const urls = (await resolveAllUrls('p')).map(u => u.url);
            expect(urls).toContain('/');
            expect(urls).toContain('/fr');
        });

        it(`${blueprint.id}: imports into a project in English only`, async () => {
            await project(['en']);
            const out = await importBundle(admin, 'p', bundleFor(blueprint, ['en']));
            expect(out.issues).toEqual([]);
        });

        it(`${blueprint.id}: imports into a project in French first, then German`, async () => {
            await project(['fr', 'de']);
            const out = await importBundle(admin, 'p', bundleFor(blueprint, ['fr', 'de']));
            expect(out.issues).toEqual([]);
        });
    }
});
