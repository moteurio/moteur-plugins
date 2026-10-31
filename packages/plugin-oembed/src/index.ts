/**
 * oEmbed block + resolve API for Studio and frontends.
 */
import { Router } from 'express';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import type { OpenAPIV3 } from 'openapi-types';
import { getProjectById } from '@moteurio/core/host.js';
import { oembedBlockSchema } from './blocks/oembed.js';
import { resolveOembed } from './oembedResolve.js';

const PLUGIN_ID = 'oembed';

async function enabled(projectId: string): Promise<boolean> {
    const project = await getProjectById(projectId);
    if (!project) return false;
    const list = project.plugins;
    if (list == null) return true;
    return list.includes(PLUGIN_ID);
}

export const manifest: PluginManifest = {
    id: PLUGIN_ID,
    label: 'oEmbed',
    description: 'Rich embed block (YouTube, Spotify, …) with server-side oEmbed resolve',
    source: 'opensource',
    kind: 'optional',
    scope: 'project',
    categories: ['content'],
    contributes: {
        api: { mounts: ['/projects'], openApi: true },
        schemas: { blocks: ['play/oembed'] },
        commands: { cli: ['play oembed'], mcp: ['play_oembed'] },
        frontend: {
            companionPackage: '@moteurio/frontend-plugin-oembed',
            blocks: ['play/oembed'],
            webComponents: ['moteur-oembed']
        }
    },
    studio: {
        companionPackage: '@moteurio/studio-plugin-oembed',
        blockTypes: ['play/oembed']
    }
};

export function init(ctx: PluginContext): void {
    ctx.registerBlockSchema(oembedBlockSchema);
    // Sites get the embed with the block, worked out once per change: no call from the page.
    ctx.registerBlockDelivery('play/oembed', async (data, { projectId }) => {
        const url = typeof data.url === 'string' ? data.url.trim() : '';
        if (!url || !(await enabled(projectId))) return data;
        return { ...data, embed: await resolveOembed(url) };
    });
    ctx.registerCommand({
        group: 'play',
        name: 'oembed',
        summary: 'The embed for a link (YouTube, Vimeo…)',
        args: [
            { name: 'project', description: 'Project id', aliases: ['projectId'], in: 'none' },
            { name: 'url', description: 'The link', required: true, positional: 0, in: 'query' }
        ],
        http: 'GET /projects/{project}/play/oembed/resolve',
        readOnly: true
    });
}

function createRouter(routeCtx: PluginRouteContext): import('express').Router {
    const router = Router({ mergeParams: true });

    router.get('/play/oembed/resolve', routeCtx.requireProjectAccess, async (req: any, res) => {
        const projectId = req.params.projectId as string;
        if (!(await enabled(projectId))) {
            res.status(404).json({ error: 'oEmbed plugin is not enabled for this project.' });
            return;
        }
        const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
        if (!url) {
            res.status(400).json({ error: 'Query parameter url is required.' });
            return;
        }
        try {
            const data = await resolveOembed(url);
            res.json(data);
        } catch (err) {
            res.status(422).json({ error: err instanceof Error ? err.message : 'Resolve failed' });
        }
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/projects/{projectId}/play/oembed/resolve': {
        get: {
            summary: 'Resolve oEmbed HTML for a URL',
            tags: ['Play'],
            parameters: [
                { name: 'projectId', in: 'path', required: true, schema: { type: 'string' } },
                {
                    name: 'url',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', format: 'uri' }
                }
            ],
            responses: {
                '200': { description: 'oEmbed payload (html, title, thumbnail_url, …)' },
                '422': { description: 'Could not embed URL' }
            }
        }
    }
};

export function getRoutes(ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/projects/:projectId',
        router: createRouter(ctx),
        openapi: { paths: openapi }
    };
}

export default { manifest, init, getRoutes };
