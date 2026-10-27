/**
 * Optional plugin: Google OAuth. Registers GET /auth/google and GET /auth/google/callback.
 */
import { Router } from 'express';
import axios from 'axios';
import type {
    PluginManifest,
    PluginRouteContext,
    PluginRouteContribution
} from '@moteurio/types/Plugin.js';
import {
    beginOAuth,
    completeOAuth,
    oauthConfig,
    redirectProviderSignIn,
    redirectLoginFailed,
    type PluginInitContext as PluginContext
} from '@moteurio/plugin-sdk';
import { startProviderSignIn } from '@moteurio/core/host.js';
import type { OpenAPIV3 } from 'openapi-types';

const NOT_OFFERED = { error: 'Google sign-in is not available on this server.' };

export const manifest: PluginManifest = {
    id: 'auth-google',
    label: 'Google OAuth',
    description: 'Sign in with Google',
    source: 'opensource',
    kind: 'optional',
    scope: 'global',
    categories: ['auth'],
    contributes: {
        api: { mounts: ['/auth'], openApi: true },
        auth: { providers: ['google'] }
    }
};

export function init(_ctx: PluginContext): void {}

function createGoogleRouter(ctx: PluginRouteContext): import('express').Router {
    const router = Router();

    router.get('/google', (req, res) => {
        const config = oauthConfig('google');
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            state: beginOAuth(req, res, 'google')
        });
        res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    });

    router.get('/google/callback', async (req: any, res: any) => {
        const config = oauthConfig('google');
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        const started = completeOAuth(req, res, 'google');
        if (!started) return redirectLoginFailed(res, 'state');
        const code = req.query.code;
        if (typeof code !== 'string' || !code) return redirectLoginFailed(res, 'failed');
        try {
            const tokenRes = await axios.post(
                'https://oauth2.googleapis.com/token',
                {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    redirect_uri: config.redirectUri,
                    grant_type: 'authorization_code'
                },
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            const { access_token } = tokenRes.data;
            const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            const profile = userInfoRes.data;
            if (typeof profile.sub !== 'string' || !profile.sub)
                return redirectLoginFailed(res, 'failed');
            const email =
                profile.email_verified === true && typeof profile.email === 'string'
                    ? profile.email
                    : '';
            const result = await startProviderSignIn(
                {
                    auth: { googleSub: profile.sub },
                    email,
                    suggestedEmail: typeof profile.email === 'string' ? profile.email : undefined,
                    name: typeof profile.name === 'string' ? profile.name : undefined
                },
                ctx.authCallbacks?.runOnboardingForNewUser,
                { link: started.link }
            );
            redirectProviderSignIn(req, res, result, started.next);
        } catch (err) {
            if (err instanceof Error && err.message === 'User is not active') {
                return redirectLoginFailed(res, 'inactive');
            }
            console.error('Google auth error:', err);
            redirectLoginFailed(res, 'failed');
        }
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/auth/google': {
        get: {
            summary: 'Redirect to Google login',
            tags: ['Auth'],
            description:
                'Redirects the user to the Google OAuth login screen. `next` (a path in the app) is where they land after signing in.',
            parameters: [
                { name: 'next', in: 'query', required: false, schema: { type: 'string' } }
            ],
            responses: { '302': { description: 'Redirect to Google login screen' } }
        }
    },
    '/auth/google/callback': {
        get: {
            summary: 'Google OAuth callback',
            tags: ['Auth'],
            description:
                'Checks `state` against the browser that started the sign-in, matches the provider identity or starts browser-bound verification/linking, then redirects to `AUTH_REDIRECT_AFTER_LOGIN` with `#token=…&next=…`, or `#error=state|email|inactive|failed`.',
            parameters: [
                { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'state', in: 'query', required: true, schema: { type: 'string' } }
            ],
            responses: {
                '302': {
                    description: 'Redirect to the app with a token or an error in the fragment'
                }
            }
        }
    }
};

export function getRoutes(ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/auth',
        router: createGoogleRouter(ctx),
        openapi: { paths: openapi }
    };
}

export function getAuthProviders() {
    return [
        {
            id: 'google',
            label: 'Google',
            enabled: oauthConfig('google') !== null,
            loginPath: '/auth/google',
            callbackPath: '/auth/google/callback'
        }
    ];
}

export default { manifest, init, getRoutes, getAuthProviders };
