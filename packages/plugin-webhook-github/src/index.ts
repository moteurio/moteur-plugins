/**
 * Optional plugin: GitHub repository webhook endpoint.
 * POST /webhooks/github — verifies X-Hub-Signature-256 (HMAC-SHA256 of raw body). Set GITHUB_WEBHOOK_SECRET.
 */
import { Router } from 'express';
import crypto from 'crypto';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import type { OpenAPIV3 } from 'openapi-types';

function getWebhookSecret(): string | undefined {
    return process.env.GITHUB_WEBHOOK_SECRET?.trim() || undefined;
}

function verifyGitHubSignature256(rawBody: string, signatureHeader: string): boolean {
    const secret = getWebhookSecret();
    if (!secret) return false;
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`;
    const sig = signatureHeader.trim();
    try {
        const a = Buffer.from(sig, 'utf8');
        const b = Buffer.from(expected, 'utf8');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

export const manifest: PluginManifest = {
    id: 'webhook-github',
    label: 'GitHub webhook',
    description: 'Inbound webhooks from GitHub (X-Hub-Signature-256 verification)',
    source: 'opensource',
    kind: 'optional',
    scope: 'global',
    categories: ['webhook'],
    contributes: {
        api: { mounts: ['/webhooks'], openApi: true },
        webhooks: { inbound: ['/webhooks/github'] }
    }
};

export function init(_ctx: PluginContext): void {}

function createGitHubWebhookRouter(): import('express').Router {
    const router = Router();

    router.post('/github', (req: any, res) => {
        const rawBody =
            typeof req.rawBody === 'string'
                ? req.rawBody
                : Buffer.isBuffer(req.body)
                  ? req.body.toString('utf8')
                  : '';
        const signature = (req.headers['x-hub-signature-256'] as string) || '';

        if (!getWebhookSecret()) {
            res.status(503).json({
                error: 'GitHub webhook is not configured. Set GITHUB_WEBHOOK_SECRET in the server environment.'
            });
            return;
        }

        if (!signature || !verifyGitHubSignature256(rawBody, signature)) {
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        const event = (req.headers['x-github-event'] as string) || '';
        if (event === 'ping') {
            res.status(200).json({ ok: true, message: 'pong' });
            return;
        }

        res.status(200).send();
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/webhooks/github': {
        post: {
            summary: 'GitHub webhook',
            description:
                'Inbound webhook from GitHub. Verifies X-Hub-Signature-256 (sha256= HMAC of raw body). Set GITHUB_WEBHOOK_SECRET.',
            tags: ['Webhooks'],
            security: [],
            parameters: [
                {
                    name: 'X-Hub-Signature-256',
                    in: 'header',
                    required: true,
                    schema: { type: 'string' }
                },
                {
                    name: 'X-GitHub-Event',
                    in: 'header',
                    required: false,
                    schema: { type: 'string' }
                }
            ],
            requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
            responses: {
                '200': { description: 'Accepted' },
                '400': { description: 'Invalid signature' },
                '503': { description: 'GitHub webhook not configured' }
            }
        }
    }
};

export function getRoutes(_ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/webhooks',
        router: createGitHubWebhookRouter(),
        openapi: { paths: openapi }
    };
}

export default { manifest, init, getRoutes };
