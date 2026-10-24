import fs from 'fs';
import path from 'path';

const root = process.cwd();
const packagesDir = path.join(root, 'packages');
const internalDeps = new Set(['@moteurio/types', '@moteurio/core', '@moteurio/plugin-sdk']);
const violations = [];

const packageDirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(packagesDir, d.name))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')));

function sourceFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
        const full = path.join(dir, d.name);
        if (d.isDirectory()) return sourceFiles(full);
        return /\.(ts|tsx|js|mjs)$/.test(d.name) ? [full] : [];
    });
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function inferMoteurLineFromPluginDeps() {
    const lines = new Set();
    for (const dir of packageDirs) {
        const pkg = readJson(path.join(dir, 'package.json'));
        const deps = { ...(pkg.peerDependencies ?? {}) };
        for (const name of internalDeps) {
            const v = deps[name];
            if (typeof v !== 'string' || !v.startsWith('^')) continue;
            lines.add(v.slice(1));
        }
    }
    if (lines.size === 0) {
        console.error(
            'validate-plugin-release-policy: could not infer EXPECTED_MOTEUR_LINE from @moteurio/* ^ ranges; set the env var'
        );
        process.exit(1);
    }
    if (lines.size > 1) {
        const sorted = [...lines].sort();
        console.error(
            `validate-plugin-release-policy: inconsistent @moteurio/* release lines: ${sorted.join(', ')}`
        );
        process.exit(1);
    }
    return [...lines][0];
}

const envLine = process.env.EXPECTED_MOTEUR_LINE?.trim();
const expectedLine = envLine || inferMoteurLineFromPluginDeps();

for (const dir of packageDirs) {
    const packageJsonPath = path.join(dir, 'package.json');
    const pkg = readJson(packageJsonPath);
    const peers = { ...(pkg.peerDependencies ?? {}) };

    if (!pkg.publishConfig || pkg.publishConfig.access !== 'public') {
        violations.push(`${pkg.name}: missing publishConfig.access=public`);
    }
    if (!pkg.scripts || !pkg.scripts.prepublishOnly) {
        violations.push(`${pkg.name}: missing prepublishOnly script`);
    }

    // One copy of the engine per host: a plugin uses the host's, so engine packages are peers.
    for (const name of internalDeps) {
        if (pkg.dependencies?.[name] !== undefined) {
            violations.push(`${pkg.name}: ${name} must be a peerDependency, not a dependency`);
        }
    }
    for (const [name, version] of Object.entries(peers)) {
        if (!internalDeps.has(name)) continue;
        if (typeof version !== 'string' || version !== `^${expectedLine}`) {
            violations.push(`${pkg.name}: invalid ${name} range "${version}"`);
        }
    }
    // Only the documented host surface: other @moteurio/core paths are internal and may move.
    for (const file of sourceFiles(path.join(dir, 'src'))) {
        for (const [, sub] of fs.readFileSync(file, 'utf8').matchAll(/['"]@moteurio\/core\/([^'"]+)['"]/g)) {
            if (sub !== 'host.js') {
                violations.push(
                    `${pkg.name}: ${path.relative(root, file)} imports @moteurio/core/${sub}; use @moteurio/core/host.js`
                );
            }
        }
    }
}

if (violations.length) {
    console.error('Plugin release policy check failed:\n');
    for (const v of violations) console.error(`- ${v}`);
    process.exit(1);
}

console.log('Plugin release policy check passed.');
