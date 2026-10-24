/**
 * Microsoft Entra ID (Azure AD) OAuth login.
 * Env: AUTH_MICROSOFT_CLIENT_ID, AUTH_MICROSOFT_CLIENT_SECRET, AUTH_MICROSOFT_REDIRECT_URI,
 * optional AUTH_MICROSOFT_TENANT (default `common`: work + personal Microsoft accounts).
 */
import { Router } from 'express';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import {
    beginOAuth,
    completeOAuth,
    exchangeAuthorizationCode,
    emailFromOidcClaims,
    fetchOidcUserInfo,
    oauthConfig,
    redirectAfterLogin,
    redirectLoginFailed,
    type PluginInitContext as PluginContext
} from '@moteurio/plugin-sdk';
import { loginWithProvider } from '@moteurio/core/host.js';
import type { OpenAPIV3 } from 'openapi-types';

const PROVIDER = 'microsoft';
const NOT_OFFERED = { error: 'Microsoft sign-in is not available on this server.' };

function tenant(): string {
    return process.env.AUTH_MICROSOFT_TENANT?.trim() || 'common';
}

function microsoftBase(): string {
    return `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0`;
}

export const manifest: PluginManifest = {
    id: 'auth-microsoft',
    label: 'Microsoft',
    description: 'Sign in with Microsoft work or school accounts',
    source: 'opensource',
    kind: 'optional',
    scope: 'global'
};

export function init(_ctx: PluginContext): void {}

function createMicrosoftRouter(ctx: PluginRouteContext): import('express').Router {
    const router = Router();

    router.get('/microsoft', (req, res) => {
        const config = oauthConfig(PROVIDER);
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: 'openid profile email User.Read',
            response_mode: 'query',
            state: beginOAuth(req, res, PROVIDER)
        });
        res.redirect(`${microsoftBase()}/authorize?${params.toString()}`);
    });

    router.get('/microsoft/callback', async (req: any, res: any) => {
        const config = oauthConfig(PROVIDER);
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        const started = completeOAuth(req, res, PROVIDER);
        if (!started) return redirectLoginFailed(res, 'state');
        const code = req.query.code;
        if (typeof code !== 'string' || !code) return redirectLoginFailed(res, 'failed');
        try {
            const tokens = await exchangeAuthorizationCode(`${microsoftBase()}/token`, config, code);
            const claims = await fetchOidcUserInfo(
                'https://graph.microsoft.com/oidc/userinfo',
                tokens.access_token
            );
            const email = emailFromOidcClaims(claims);
            if (!email) return redirectLoginFailed(res, 'email');
            const sub = typeof claims.sub === 'string' ? claims.sub : '';
            const name = typeof claims.name === 'string' ? claims.name : undefined;
            const { token } = await loginWithProvider(
                { auth: { microsoftSub: sub }, email, name },
                ctx.authCallbacks?.runOnboardingForNewUser
            );
            redirectAfterLogin(res, token, started.next);
        } catch (err) {
            if (err instanceof Error && err.message === 'User is not active') {
                return redirectLoginFailed(res, 'inactive');
            }
            console.error('Microsoft auth error:', err);
            redirectLoginFailed(res, 'failed');
        }
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/auth/microsoft': {
        get: {
            summary: 'Redirect to Microsoft login',
            tags: ['Auth'],
            parameters: [{ name: 'next', in: 'query', required: false, schema: { type: 'string' } }],
            responses: { '302': { description: 'Redirect to Microsoft' } }
        }
    },
    '/auth/microsoft/callback': {
        get: {
            summary: 'Microsoft OAuth callback',
            tags: ['Auth'],
            parameters: [
                { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
                { name: 'state', in: 'query', required: true, schema: { type: 'string' } }
            ],
            responses: { '302': { description: 'Redirect to the app with token or error' } }
        }
    }
};

export function getRoutes(ctx: PluginRouteContext): PluginRouteContribution {
    return {
        path: '/auth',
        router: createMicrosoftRouter(ctx),
        openapi: { paths: openapi }
    };
}

export function getAuthProviders() {
    return [
        {
            id: 'microsoft',
            label: 'Microsoft',
            enabled: oauthConfig(PROVIDER) !== null,
            loginPath: '/auth/microsoft',
            callbackPath: '/auth/microsoft/callback'
        }
    ];
}

export default { manifest, init, getRoutes, getAuthProviders };
