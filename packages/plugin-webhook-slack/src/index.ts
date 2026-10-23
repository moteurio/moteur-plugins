/**
 * Optional plugin: Slack incoming webhook endpoint.
 * POST /webhooks/slack — verifies X-Slack-Signature and X-Slack-Request-Timestamp. Set SLACK_SIGNING_SECRET.
 */
import { Router } from 'express';
import crypto from 'crypto';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import type { OpenAPIV3 } from 'openapi-types';

function getSigningSecret(): string | undefined {
    return process.env.SLACK_SIGNING_SECRET?.trim() || undefined;
}

function verifySlackSignature(rawBody: string, signature: string, timestamp: string): boolean {
    const secret = getSigningSecret();
    if (!secret) return false;
    const base = `v0:${timestamp}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', secret).update(base).digest('hex');
    const expected = `v0=${hmac}`;
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
}

export const manifest: PluginManifest = {
    id: 'webhook-slack',
    label: 'Slack webhook',
    description: 'Incoming webhook endpoint for Slack (signature verification)',
    source: 'opensource',
    kind: 'optional',
    scope: 'global'
};

export function init(_ctx: PluginContext): void {}

function createSlackWebhookRouter(): import('express').Router {
    const router = Router();

    router.post('/slack', (req: any, res) => {
        const rawBody = typeof req.rawBody === 'string' ? req.rawBody : (Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '');
        const signature = (req.headers['x-slack-signature'] as string) || '';
        const timestamp = (req.headers['x-slack-request-timestamp'] as string) || '';

        if (!getSigningSecret()) {
            res.status(503).json({
                error: 'Slack webhook is not configured. Set SLACK_SIGNING_SECRET in the server environment.'
            });
            return;
        }

        const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
        if (Number.isNaN(age) || age > 300) {
            res.status(400).json({ error: 'Request timestamp too old or invalid' });
            return;
        }

        if (!verifySlackSignature(rawBody, signature, timestamp)) {
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        res.status(200).send();
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/webhooks/slack': {
        post: {
            summary: 'Slack webhook',
            description: 'Incoming webhook from Slack. Verifies X-Slack-Signature and X-Slack-Request-Timestamp. Set SLACK_SIGNING_SECRET.',
            tags: ['Webhooks'],
            security: [],
            parameters: [
                { name: 'X-Slack-Signature', in: 'header', required: true, schema: { type: 'string' } },
                { name: 'X-Slack-Request-Timestamp', in: 'header', required: true, schema: { type: 'string' } }
            ],
            requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
            responses: {
                '200': { description: 'Accepted' },
                '400': { description: 'Invalid signature or timestamp' },
                '503': { description: 'Slack webhook not configured' }
            }
        }
    }
};

export function getRoutes(_ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/webhooks',
        router: createSlackWebhookRouter(),
        openapi: { paths: openapi }
    };
}

export default { manifest, init, getRoutes };
