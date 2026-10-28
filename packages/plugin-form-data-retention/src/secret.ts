import crypto from 'crypto';

/**
 * The key a project's request references are signed with. It is derived from the server's
 * `JWT_SECRET`, as the plugin SDK derives its OAuth key, so it is never written anywhere: not in
 * Git, not in a workspace snapshot, not in a backup of the project. Each project gets its own.
 */
export function projectKey(projectId: string): Buffer {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) throw new Error('JWT_SECRET must be set to sign request references.');
    return crypto.createHmac('sha256', secret).update(`moteur-form-data-retention|${projectId}`).digest();
}
