/**
 * Optional plugin: GitHub OAuth. Registers GET /auth/github and GET /auth/github/callback.
 */
import { Router } from 'express';
import axios from 'axios';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import {
    beginOAuth,
    completeOAuth,
    oauthConfig,
    redirectAfterLogin,
    redirectLoginFailed,
    type PluginInitContext as PluginContext
} from '@moteurio/plugin-sdk';
import { loginWithProvider } from '@moteurio/core/host.js';
import type { OpenAPIV3 } from 'openapi-types';

const NOT_OFFERED = { error: 'GitHub sign-in is not available on this server.' };

export const manifest: PluginManifest = {
    id: 'auth-github',
    label: 'GitHub OAuth',
    description: 'Sign in with GitHub',
    source: 'opensource',
    kind: 'optional',
    scope: 'global'
};

export function init(_ctx: PluginContext): void {}

function createGitHubRouter(ctx: PluginRouteContext): import('express').Router {
    const router = Router();

    router.get('/github', (req, res) => {
        const config = oauthConfig('github');
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: 'read:user user:email',
            state: beginOAuth(req, res, 'github')
        });
        res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
    });

    router.get('/github/callback', async (req: any, res: any) => {
        const config = oauthConfig('github');
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        const started = completeOAuth(req, res, 'github');
        if (!started) return redirectLoginFailed(res, 'state');
        const code = req.query.code;
        if (typeof code !== 'string' || !code) return redirectLoginFailed(res, 'failed');
        try {
            const tokenRes = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    redirect_uri: config.redirectUri
                },
                { headers: { Accept: 'application/json' } }
            );
            const accessToken = tokenRes.data.access_token;
            if (!accessToken) return redirectLoginFailed(res, 'failed');
            const headers = { Authorization: `Bearer ${accessToken}` };
            const [userRes, emailsRes] = await Promise.all([
                axios.get('https://api.github.com/user', { headers }),
                axios.get('https://api.github.com/user/emails', { headers })
            ]);
            const email = emailsRes.data.find(
                (e: { primary?: boolean; verified?: boolean; email?: string }) =>
                    e.primary && e.verified
            )?.email;
            if (!email) return redirectLoginFailed(res, 'email');
            const profile = userRes.data;
            const { token } = await loginWithProvider(
                { auth: { githubId: profile.id }, email, name: profile.name || profile.login },
                ctx.authCallbacks?.runOnboardingForNewUser
            );
            redirectAfterLogin(res, token, started.next);
        } catch (err) {
            if (err instanceof Error && err.message === 'User is not active') {
                return redirectLoginFailed(res, 'inactive');
            }
            console.error('GitHub callback error:', err);
            redirectLoginFailed(res, 'failed');
        }
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/auth/github': {
        get: {
            summary: 'Redirect to GitHub login',
            tags: ['Auth'],
            description:
                "Redirects the user to GitHub's OAuth login screen. `next` (a path in the app) is where they land after signing in.",
            parameters: [{ name: 'next', in: 'query', required: false, schema: { type: 'string' } }],
            responses: { '302': { description: 'Redirect to GitHub OAuth screen' } }
        }
    },
    '/auth/github/callback': {
        get: {
            summary: 'GitHub OAuth callback',
            tags: ['Auth'],
            description:
                'Checks `state` against the browser that started the sign-in, creates or reuses the account with the verified primary email, then redirects to `AUTH_REDIRECT_AFTER_LOGIN` with `#token=…&next=…`, or `#error=state|email|inactive|failed`.',
            parameters: [
                { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'state', in: 'query', required: true, schema: { type: 'string' } }
            ],
            responses: { '302': { description: 'Redirect to the app with a token or an error in the fragment' } }
        }
    }
};

export function getRoutes(ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/auth',
        router: createGitHubRouter(ctx),
        openapi: { paths: openapi }
    };
}

export function getAuthProviders() {
    return [
        {
            id: 'github',
            label: 'GitHub',
            enabled: oauthConfig('github') !== null,
            loginPath: '/auth/github',
            callbackPath: '/auth/github/callback'
        }
    ];
}

export default { manifest, init, getRoutes, getAuthProviders };
