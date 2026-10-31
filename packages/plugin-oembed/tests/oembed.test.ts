import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@moteurio/core/host.js', () => ({
    getProjectById: vi.fn(async (id: string) => (id === 'off' ? { plugins: ['geo'] } : { plugins: null }))
}));

import { init } from '../src/index.js';
import { clearOembedCache, iframeOf, providerFor, resolveOembed } from '../src/oembedResolve.js';

const youtube = {
    type: 'video',
    title: 'A talk',
    provider_name: 'YouTube',
    thumbnail_url: 'https://i.ytimg.com/vi/x/hq.jpg',
    html: '<iframe width="560" height="315" src="https://www.youtube.com/embed/x?feature=oembed&amp;a=1" allow="autoplay; fullscreen" title="A talk"></iframe>'
};

const answer = (body: unknown, status = 200) =>
    vi.fn(
        async () =>
            new Response(JSON.stringify(body), {
                status,
                headers: { 'content-type': 'application/json' }
            })
    );

describe('embeds, asked of the provider', () => {
    beforeEach(() => clearOembedCache());
    afterEach(() => vi.unstubAllGlobals());

    it('asks only providers it knows, at their own endpoint', async () => {
        expect(providerFor('https://youtu.be/x')?.name).toBe('YouTube');
        expect(providerFor('https://x.com/a/status/1')?.name).toBe('X');
        expect(providerFor('https://evil.example/youtube.com')).toBeUndefined();
        expect(providerFor('http://169.254.169.254/latest')).toBeUndefined();
        expect(providerFor('javascript:alert(1)')).toBeUndefined();
        const fetch = answer(youtube);
        vi.stubGlobal('fetch', fetch);
        await expect(resolveOembed('https://intranet.local/page')).rejects.toThrow();
        expect(fetch).not.toHaveBeenCalled();
        await resolveOembed('https://www.youtube.com/watch?v=x');
        expect(String(fetch.mock.calls[0][0])).toBe(
            'https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dx'
        );
    });

    it('hands sites the frame to build, not HTML to insert', async () => {
        vi.stubGlobal('fetch', answer(youtube));
        const out = await resolveOembed('https://youtu.be/x');
        expect(out.iframe).toEqual({
            src: 'https://www.youtube.com/embed/x?feature=oembed&a=1',
            width: 560,
            height: 315,
            allow: 'autoplay; fullscreen'
        });
        expect(out.title).toBe('A talk');
        // A script embed is not a frame; neither is a frame with something else, or over http.
        expect(
            iframeOf('<blockquote>t</blockquote><script src="https://platform.x.com/w.js"></script>')
        ).toBeUndefined();
        expect(iframeOf('<iframe src="https://a"></iframe><img src=x onerror=alert(1)>')).toBeUndefined();
        expect(iframeOf('<iframe src="http://a"></iframe>')).toBeUndefined();
    });

    it('keeps an embed, and says so when the provider has none', async () => {
        const fetch = answer(youtube);
        vi.stubGlobal('fetch', fetch);
        await resolveOembed('https://youtu.be/x');
        await resolveOembed('https://youtu.be/x');
        expect(fetch).toHaveBeenCalledTimes(1);
        vi.stubGlobal('fetch', answer({ error: 'Not found' }, 404));
        await expect(resolveOembed('https://vimeo.com/1')).rejects.toThrow('Vimeo answered 404');
    });

    it('sends the embed with the block to sites, for projects that use the plugin', async () => {
        let deliver: ((data: Record<string, unknown>, c: { projectId: string }) => unknown) | undefined;
        init({
            registerBlockSchema: () => {},
            registerCommand: () => {},
            registerBlockDelivery: (type: string, fn: typeof deliver) => {
                expect(type).toBe('play/oembed');
                deliver = fn;
            }
        } as never);
        vi.stubGlobal('fetch', answer(youtube));
        const data = { url: 'https://youtu.be/x', caption: 'Watch' };
        const out = (await deliver!(data, { projectId: 'site' })) as {
            embed: { iframe: { src: string } };
        };
        expect(out.embed.iframe.src).toContain('youtube.com/embed/x');
        expect(await deliver!(data, { projectId: 'off' })).toBe(data);
        expect(await deliver!({ url: '' }, { projectId: 'site' })).toEqual({ url: '' });
    });
});
