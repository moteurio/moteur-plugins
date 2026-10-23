/**
 * Default core block schemas. When the core-blocks plugin is enabled, these are registered
 * so listBlocks() returns them (overlaying or replacing file-based blocks of the same type).
 */
import type { BlockSchema } from '@moteurio/types/Block.js';

export const defaultCoreBlockSchemas: BlockSchema[] = [
    {
        type: 'core/paragraph',
        label: 'Paragraph',
        description: 'A rich text paragraph block.',
        category: 'content',
        fields: {
            content: {
                type: 'core/rich-text',
                label: 'Content',
                multilingual: true,
                required: true
            }
        }
    },
    {
        type: 'core/heading',
        label: 'Heading',
        description: 'A semantic heading block. Level controls h1–h6 output.',
        category: 'content',
        variantHints: ['display', 'section', 'label'],
        fields: {
            text: {
                type: 'core/text',
                label: 'Heading Text',
                multilingual: true,
                required: true
            },
            level: {
                type: 'core/select',
                label: 'Heading Level',
                options: { choices: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
                default: 'h2'
            }
        }
    },
    {
        type: 'core/image',
        label: 'Image',
        description: 'A single image block.',
        category: 'media',
        fields: {
            image: { type: 'core/image', label: 'Image', required: true },
            title: { type: 'core/text', label: 'Title', multilingual: true },
            caption: { type: 'core/text', label: 'Caption', multilingual: true },
            credit: { type: 'core/text', label: 'Credit', multilingual: true }
        }
    },
    {
        type: 'core/spacer',
        label: 'Spacer',
        description: 'Adds vertical space between blocks.',
        category: 'layout',
        fields: {
            size: {
                type: 'core/select',
                label: 'Spacing size',
                options: { choices: ['xs', 'sm', 'md', 'lg', 'xl'] },
                default: 'md'
            },
            custom: {
                type: 'core/number',
                label: 'Custom height (px)',
                description: 'Overrides predefined size if set.'
            }
        }
    },
    {
        type: 'core/quote',
        label: 'Quote',
        description: 'A block quote with optional attribution.',
        category: 'content',
        fields: {
            text: { type: 'core/rich-text', label: 'Quote', multilingual: true, required: true },
            author: { type: 'core/text', label: 'Author', multilingual: true },
            attribution: { type: 'core/text', label: 'Attribution', multilingual: true }
        }
    },
    {
        type: 'core/divider',
        label: 'Divider',
        description: 'A horizontal divider line.',
        category: 'layout',
        fields: {}
    },
    {
        type: 'core/button',
        label: 'Button',
        description: 'A call-to-action button.',
        category: 'content',
        fields: {
            label: { type: 'core/text', label: 'Label', multilingual: true, required: true },
            url: { type: 'core/text', label: 'URL' },
            variant: {
                type: 'core/select',
                label: 'Variant',
                options: { choices: ['primary', 'secondary', 'outline'] },
                default: 'primary'
            }
        }
    }
];
