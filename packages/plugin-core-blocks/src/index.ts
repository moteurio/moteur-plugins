/**
 * Optional plugin: Default core block schemas.
 * When enabled, registers built-in block types (paragraph, heading, image, spacer, quote, divider, button).
 */
import type { PluginManifest } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import { defaultCoreBlockSchemas } from './data/coreBlocks.js';

export const manifest: PluginManifest = {
    id: 'core-blocks',
    label: 'Default core blocks',
    description: 'Built-in block types: paragraph, heading, image, spacer, quote, divider, button',
    source: 'opensource',
    kind: 'optional',
    scope: 'project',
    categories: ['content'],
    contributes: {
        schemas: {
            blocks: [
                'core/paragraph',
                'core/heading',
                'core/image',
                'core/spacer',
                'core/quote',
                'core/divider',
                'core/button'
            ]
        }
    },
    studio: {
        blockTypes: [
            'core/paragraph',
            'core/heading',
            'core/image',
            'core/spacer',
            'core/quote',
            'core/divider',
            'core/button'
        ]
    }
};

export function init(ctx: PluginContext): void {
    for (const schema of defaultCoreBlockSchemas) {
        ctx.registerBlockSchema(schema);
    }
    // Structures (core/audit, core/publishable, core/seo, core/source) ship from the engine.
}

export default { manifest, init };
