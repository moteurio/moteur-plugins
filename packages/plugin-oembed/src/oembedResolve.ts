const CACHE = new Map<string, { at: number; data: OembedResult }>();
const TTL_MS = 15 * 60 * 1000;

export type OembedResult = {
    html?: string;
    title?: string;
    author_name?: string;
    provider_name?: string;
    thumbnail_url?: string;
    type?: string;
};

function cacheKey(url: string): string {
    return url;
}

export async function resolveOembed(url: string): Promise<OembedResult> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('URL must be http or https');
    }

    const hit = CACHE.get(cacheKey(url));
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
        const err = typeof data.error === 'string' ? data.error : 'oEmbed failed';
        throw new Error(err);
    }
    const out: OembedResult = {
        html: typeof data.html === 'string' ? data.html : undefined,
        title: typeof data.title === 'string' ? data.title : undefined,
        author_name: typeof data.author_name === 'string' ? data.author_name : undefined,
        provider_name: typeof data.provider_name === 'string' ? data.provider_name : undefined,
        thumbnail_url: typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined,
        type: typeof data.type === 'string' ? data.type : undefined
    };
    if (!out.html && !out.thumbnail_url) {
        throw new Error('No embed HTML returned for this URL');
    }
    CACHE.set(cacheKey(url), { at: Date.now(), data: out });
    return out;
}
