/**
 * An embed for a link, asked of its provider's own oEmbed endpoint (no third party in between).
 * Only the providers listed are asked: a link elsewhere is not an embed, and the server never
 * fetches an address an editor typed.
 *
 * Sites get `iframe` when the provider's HTML is one iframe (YouTube, Vimeo, Spotify…): they
 * build the frame themselves and never insert the provider's HTML. `html` stays for the
 * providers whose embed is a script (X, TikTok), for sites that choose to trust it.
 */

export type OembedResult = {
    /** The embed's frame, when the provider's HTML is one iframe. */
    iframe?: { src: string; width?: number; height?: number; allow?: string };
    /** The provider's HTML as it came: insert it only if you trust the provider. */
    html?: string;
    title?: string;
    author_name?: string;
    provider_name?: string;
    thumbnail_url?: string;
    type?: string;
    width?: number;
    height?: number;
};

type Provider = { name: string; hosts: RegExp; endpoint: string };

/** From oembed.com's provider list: the ones people paste most. */
export const PROVIDERS: Provider[] = [
    {
        name: 'YouTube',
        hosts: /^(www\.|m\.)?(youtube\.com|youtu\.be)$/,
        endpoint: 'https://www.youtube.com/oembed?format=json&url='
    },
    {
        name: 'Vimeo',
        hosts: /^(www\.|player\.)?vimeo\.com$/,
        endpoint: 'https://vimeo.com/api/oembed.json?url='
    },
    {
        name: 'Spotify',
        hosts: /^open\.spotify\.com$/,
        endpoint: 'https://open.spotify.com/oembed?url='
    },
    {
        name: 'SoundCloud',
        hosts: /^(www\.|m\.)?soundcloud\.com$/,
        endpoint: 'https://soundcloud.com/oembed?format=json&url='
    },
    {
        name: 'X',
        hosts: /^(www\.|mobile\.)?(twitter|x)\.com$/,
        endpoint: 'https://publish.twitter.com/oembed?url='
    },
    {
        name: 'TikTok',
        hosts: /^(www\.)?tiktok\.com$/,
        endpoint: 'https://www.tiktok.com/oembed?url='
    },
    {
        name: 'Dailymotion',
        hosts: /^(www\.)?(dailymotion\.com|dai\.ly)$/,
        endpoint: 'https://www.dailymotion.com/services/oembed?format=json&url='
    },
    {
        name: 'CodePen',
        hosts: /^codepen\.io$/,
        endpoint: 'https://codepen.io/api/oembed?format=json&url='
    },
    {
        name: 'Flickr',
        hosts: /^(www\.)?(flickr\.com|flic\.kr)$/,
        endpoint: 'https://www.flickr.com/services/oembed/?format=json&url='
    }
];

/** How long a provider may take: under the 3 seconds a block's delivery is given. */
export const TIMEOUT_MS = 2500;
const TTL_MS = 60 * 60 * 1000;
const MAX_KEPT = 500;
const CACHE = new Map<string, { at: number; data: OembedResult }>();

/** Forget every kept embed (tests). */
export function clearOembedCache(): void {
    CACHE.clear();
}

export function providerFor(url: string): Provider | undefined {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return undefined;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined;
    return PROVIDERS.find(p => p.hosts.test(parsed.hostname.toLowerCase()));
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);
const num = (v: unknown) => {
    const n = typeof v === 'string' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

/** The one https iframe the HTML is, if that is all it is. */
export function iframeOf(html: string | undefined): OembedResult['iframe'] {
    if (!html) return undefined;
    const tags = html.match(/<[a-z][^>]*>/gi) ?? [];
    if (tags.length !== 1 || !/^<iframe\b/i.test(tags[0])) return undefined;
    const attr = (name: string) =>
        tags[0]
            .match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
            ?.slice(1)
            .find(v => v != null);
    const src = attr('src')?.replace(/&amp;/g, '&');
    if (!src || !/^https:\/\//i.test(src)) return undefined;
    return {
        src,
        width: num(attr('width')),
        height: num(attr('height')),
        allow: str(attr('allow'))
    };
}

export async function resolveOembed(url: string): Promise<OembedResult> {
    const provider = providerFor(url);
    if (!provider) throw new Error('This link is not from a provider that embeds');

    const hit = CACHE.get(url);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    const res = await globalThis.fetch(provider.endpoint + encodeURIComponent(url), {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: globalThis.AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`${provider.name} answered ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const html = str(data.html);
    const thumbnail = str(data.thumbnail_url);
    const out: OembedResult = {
        iframe: iframeOf(html),
        html,
        title: str(data.title),
        author_name: str(data.author_name),
        provider_name: str(data.provider_name) ?? provider.name,
        thumbnail_url: thumbnail?.startsWith('https://') ? thumbnail : undefined,
        type: str(data.type),
        width: num(data.width),
        height: num(data.height)
    };
    if (!out.html && !out.thumbnail_url) throw new Error('No embed for this link');

    // Oldest out first when full.
    CACHE.delete(url);
    CACHE.set(url, { at: Date.now(), data: out });
    if (CACHE.size > MAX_KEPT) CACHE.delete(CACHE.keys().next().value!);
    return out;
}
