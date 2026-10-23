/**
 * Sets every packages/plugin-* version and @moteurio/* dependency ranges to the release line.
 * Used by the release orchestrator (same calendar line as the engine when publishing plugins).
 *
 * EXPECTED_MOTEUR_LINE or RELEASE_LINE (required), e.g. 2026.10.23
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const packagesDir = path.join(root, 'packages');
const internalDeps = ['@moteurio/types', '@moteurio/core', '@moteurio/plugin-sdk'];

const line = (process.env.EXPECTED_MOTEUR_LINE || process.env.RELEASE_LINE || '').trim();
if (!line) {
    console.error('set-plugin-release-line: set EXPECTED_MOTEUR_LINE or RELEASE_LINE');
    process.exit(1);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, obj) {
    fs.writeFileSync(filePath, `${JSON.stringify(obj, null, 4)}\n`, 'utf8');
}

const packageDirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('plugin-'))
    .map(d => path.join(packagesDir, d.name))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')));

let updated = 0;
for (const dir of packageDirs) {
    const filePath = path.join(dir, 'package.json');
    const pkg = readJson(filePath);
    let changed = false;
    if (pkg.version !== line) {
        pkg.version = line;
        changed = true;
    }
    const deps = pkg.dependencies ?? {};
    for (const name of internalDeps) {
        const want = `^${line}`;
        if (deps[name] !== undefined && deps[name] !== want) {
            deps[name] = want;
            changed = true;
        }
    }
    if (changed) {
        pkg.dependencies = deps;
        writeJson(filePath, pkg);
        updated += 1;
        console.error(`set-plugin-release-line: ${pkg.name} -> ${line}`);
    }
}

if (updated === 0) {
    console.error('set-plugin-release-line: all plugin packages already at release line');
}

console.log(line);
