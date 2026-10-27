/**
 * Optional plugin: Default core blueprints.
 * When enabled, registers built-in blueprints (blog, empty, blog-post, basic-page, seo, default template).
 */
import type { PluginManifest } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import { defaultCoreBlueprints } from './data/coreBlueprints.js';

export const manifest: PluginManifest = {
    id: 'core-blueprints',
    label: 'Default core blueprints',
    description: 'Built-in project, model, structure, and template blueprints',
    source: 'opensource',
    kind: 'optional',
    scope: 'project',
    categories: ['content'],
    contributes: {
        schemas: {
            blueprints: [
                'blog',
                'empty',
                'blog-post',
                'basic-page',
                'seo',
                'default',
                'publishable',
                'landing',
                'article'
            ]
        }
    }
};

export function init(ctx: PluginContext): void {
    for (const blueprint of defaultCoreBlueprints) {
        ctx.registerBlueprint(blueprint);
    }
}

export default { manifest, init };
