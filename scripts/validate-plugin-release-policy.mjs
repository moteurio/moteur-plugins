import fs from 'fs';
import path from 'path';

const root = process.cwd();
const packagesDir = path.join(root, 'packages');
const internalDeps = new Set(['@moteurio/types', '@moteurio/core', '@moteurio/ai', '@moteurio/plugin-sdk']);
const violations = [];

const packageDirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(packagesDir, d.name))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')));

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function inferMoteurLineFromPluginDeps() {
    const lines = new Set();
    for (const dir of packageDirs) {
        const pkg = readJson(path.join(dir, 'package.json'));
        const deps = { ...(pkg.dependencies ?? {}) };
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
    const deps = { ...(pkg.dependencies ?? {}) };

    if (!pkg.publishConfig || pkg.publishConfig.access !== 'public') {
        violations.push(`${pkg.name}: missing publishConfig.access=public`);
    }
    if (!pkg.scripts || !pkg.scripts.prepublishOnly) {
        violations.push(`${pkg.name}: missing prepublishOnly script`);
    }

    for (const [name, version] of Object.entries(deps)) {
        if (!internalDeps.has(name)) continue;
        if (typeof version !== 'string' || version !== `^${expectedLine}`) {
            violations.push(`${pkg.name}: invalid ${name} range "${version}"`);
        }
    }
}

if (violations.length) {
    console.error('Plugin release policy check failed:\n');
    for (const v of violations) console.error(`- ${v}`);
    process.exit(1);
}

console.log('Plugin release policy check passed.');
