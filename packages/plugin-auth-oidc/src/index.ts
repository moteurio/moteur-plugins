/**
 * Generic OpenID Connect login (Auth0, Okta, Keycloak, etc.).
 * Env: AUTH_OIDC_CLIENT_ID, AUTH_OIDC_CLIENT_SECRET, AUTH_OIDC_REDIRECT_URI,
 * AUTH_OIDC_ISSUER, optional AUTH_OIDC_SCOPES (default openid email profile).
 */
import { Router } from 'express';
import type { PluginManifest, PluginRouteContext, PluginRouteContribution } from '@moteurio/types/Plugin.js';
import {
    beginOAuth,
    completeOAuth,
    discoverOidcIssuer,
    exchangeAuthorizationCode,
    emailFromOidcClaims,
    fetchOidcUserInfo,
    oauthConfig,
    parseJwtPayload,
    redirectAfterLogin,
    redirectLoginFailed,
    type PluginInitContext as PluginContext
} from '@moteurio/plugin-sdk';
import { loginWithProvider } from '@moteurio/core/auth.js';
import type { OpenAPIV3 } from 'openapi-types';

const PROVIDER = 'oidc';
const NOT_OFFERED = { error: 'OpenID Connect sign-in is not available on this server.' };

let discoveryCache: { issuer: string; doc: Awaited<ReturnType<typeof discoverOidcIssuer>> } | null =
    null;

function issuerEnv(): string | null {
    const v = process.env.AUTH_OIDC_ISSUER?.trim();
    return v || null;
}

function scopes(): string {
    return process.env.AUTH_OIDC_SCOPES?.trim() || 'openid email profile';
}

async function discovery(): Promise<Awaited<ReturnType<typeof discoverOidcIssuer>> | null> {
    const issuer = issuerEnv();
    if (!issuer) return null;
    if (discoveryCache?.issuer === issuer) return discoveryCache.doc;
    const doc = await discoverOidcIssuer(issuer);
    discoveryCache = { issuer, doc };
    return doc;
}

function oidcEnabled(): boolean {
    return oauthConfig(PROVIDER) !== null && issuerEnv() !== null;
}

export const manifest: PluginManifest = {
    id: 'auth-oidc',
    label: 'OpenID Connect',
    description: 'Sign in with any OIDC provider (Auth0, Okta, Keycloak, …)',
    source: 'opensource',
    kind: 'optional',
    scope: 'global'
};

export function init(_ctx: PluginContext): void {}

function createOidcRouter(ctx: PluginRouteContext): import('express').Router {
    const router = Router();

    router.get('/oidc', async (req, res) => {
        const config = oauthConfig(PROVIDER);
        if (!config) {
            res.status(404).json(NOT_OFFERED);
            return;
        }
        let meta;
        try {
            meta = await discovery();
        } catch (err) {
            console.error('[auth-oidc] discovery failed:', err);
            res.status(503).json({ error: 'OIDC discovery failed' });
            return;
        }
        if (!meta) {
            res.status(404).json({ error: 'AUTH_OIDC_ISSUER is not set.' });
            return;
        }
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: scopes(),
            state: beginOAuth(req, res, PROVIDER)
        });
        res.redirect(`${meta.authorization_endpoint}?${params.toString()}`);
    });

    router.get('/oidc/callback', async (req: any, res: any) => {
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
            const meta = await discovery();
            if (!meta) return redirectLoginFailed(res, 'failed');
            const tokens = await exchangeAuthorizationCode(meta.token_endpoint, config, code);
            let claims: Record<string, unknown> = {};
            if (meta.userinfo_endpoint) {
                claims = await fetchOidcUserInfo(meta.userinfo_endpoint, tokens.access_token);
            } else if (tokens.id_token) {
                claims = parseJwtPayload(tokens.id_token) ?? {};
            }
            const email = emailFromOidcClaims(claims);
            if (!email) return redirectLoginFailed(res, 'email');
            const sub = typeof claims.sub === 'string' ? claims.sub : '';
            const iss = typeof claims.iss === 'string' ? claims.iss : meta.issuer ?? issuerEnv() ?? 'oidc';
            const name =
                typeof claims.name === 'string'
                    ? claims.name
                    : typeof claims.given_name === 'string'
                      ? claims.given_name
                      : undefined;
            const { token } = await loginWithProvider(
                { auth: { oidcSub: `${iss}#${sub}` }, email, name },
                ctx.authCallbacks?.runOnboardingForNewUser
            );
            redirectAfterLogin(res, token, started.next);
        } catch (err) {
            if (err instanceof Error && err.message === 'User is not active') {
                return redirectLoginFailed(res, 'inactive');
            }
            console.error('OIDC auth error:', err);
            redirectLoginFailed(res, 'failed');
        }
    });

    return router;
}

const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/auth/oidc': {
        get: {
            summary: 'Redirect to OIDC login',
            tags: ['Auth'],
            parameters: [{ name: 'next', in: 'query', required: false, schema: { type: 'string' } }],
            responses: { '302': { description: 'Redirect to the OIDC provider' } }
        }
    },
    '/auth/oidc/callback': {
        get: {
            summary: 'OIDC callback',
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
        router: createOidcRouter(ctx),
        openapi: { paths: openapi }
    };
}

export function getAuthProviders() {
    return [
        {
            id: 'oidc',
            label: process.env.AUTH_OIDC_LABEL?.trim() || 'SSO',
            enabled: oidcEnabled(),
            loginPath: '/auth/oidc',
            callbackPath: '/auth/oidc/callback'
        }
    ];
}

export default { manifest, init, getRoutes, getAuthProviders };
