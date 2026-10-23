import type { BlockSchema } from '@moteurio/types/Block.js';

export const oembedBlockSchema: BlockSchema = {
    type: 'play/oembed',
    label: 'Embed',
    description: 'Paste a URL (YouTube, Vimeo, Spotify, Twitter/X, etc.) and render the rich embed.',
    category: 'media',
    fields: {
        url: {
            type: 'core/url',
            label: 'URL',
            required: true,
            description: 'Link to the page or media to embed.'
        },
        caption: {
            type: 'core/text',
            label: 'Caption',
            options: { multilingual: true }
        },
        maxWidth: {
            type: 'core/number',
            label: 'Max width (px)',
            description: 'Optional width hint for the iframe wrapper.'
        }
    }
};
