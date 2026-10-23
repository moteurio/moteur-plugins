/**
 * Optional plugin: Vercel deploy webhook endpoint.
 * POST /webhooks/vercel — verifies x-vercel-signature (HMAC-SHA1 of body). Set VERCEL_WEBHOOK_SECRET.
 */
import { Router } from 'express';
import crypto from 'crypto';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import type { OpenAPIV3 } from 'openapi-types';

function getWebhookSecret(): string | undefined {
    return process.env.VERCEL_WEBHOOK_SECRET?.trim() || undefined;
}

function verifyVercelSignature(rawBody: string, signature: string): boolean {
    const secret = getWebhookSecret();
    if (!secret) return false;
    const hmac = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(hmac, 'utf8'));
}

export const manifest: PluginManifest = {
    id: 'webhook-vercel',
    label: 'Vercel webhook',
    description: 'Deploy hook endpoint for Vercel (signature verification)',
    source: 'opensource',
    kind: 'optional',
    scope: 'global'
};

export function init(_ctx: PluginContext): void {}

function createVercelWebhookRouter(): import('express').Router {
    const router = Router();

    router.post('/vercel', (req: any, res) => {
        const rawBody = typeof req.rawBody === 'string' ? req.rawBody : (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '');
        const signature = (req.headers['x-vercel-signature'] as string) || '';

        if (!getWebhookSecret()) {
            res.status(503).json({
                error: 'Vercel webhook is not configured. Set VERCEL_WEBHOOK_SECRET in the server environment.'
            });
            return;
        }

        if (!verifyVercelSignature(rawBody, signature)) {
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        res.status(200).send();
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/webhooks/vercel': {
        post: {
            summary: 'Vercel webhook',
            description: 'Deploy hook from Vercel. Verifies x-vercel-signature. Set VERCEL_WEBHOOK_SECRET.',
            tags: ['Webhooks'],
            security: [],
            parameters: [
                { name: 'x-vercel-signature', in: 'header', required: true, schema: { type: 'string' } }
            ],
            requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
            responses: {
                '200': { description: 'Accepted' },
                '400': { description: 'Invalid signature' },
                '503': { description: 'Vercel webhook not configured' }
            }
        }
    }
};

export function getRoutes(_ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/webhooks',
        router: createVercelWebhookRouter(),
        openapi: { paths: openapi }
    };
}

export default { manifest, init, getRoutes };
