/**
 * Default core blueprint schemas. When the core-blueprints plugin is enabled, these are registered
 * so listBlueprints() / getBlueprint() return them.
 */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';

export const defaultCoreBlueprints: BlueprintSchema[] = [
    {
        id: 'blog',
        name: 'Blog',
        description: 'A simple blog with a Post model and a basic page template.',
        kind: 'project',
        template: {
            models: [
                {
                    id: 'post',
                    label: 'Post',
                    description: 'Blog post entry',
                    modelType: 'content',
                    fields: {
                        title: { type: 'core/text', label: 'Title', options: { multilingual: true } },
                        excerpt: { type: 'core/text', label: 'Excerpt', options: { multilingual: true, ui: 'textarea' } },
                        body: { type: 'core/rich-text', label: 'Body', options: { multilingual: true } }
                    }
                }
            ],
            layouts: [],
            structures: []
        }
    },
    {
        id: 'empty',
        name: 'Empty project',
        description: 'Empty project with no models, layouts, or structures.',
        kind: 'project',
        template: { models: [], layouts: [], structures: [] }
    },
    {
        id: 'person',
        name: 'Person',
        description: 'People who show on the site: a team, authors, speakers.',
        kind: 'model',
        template: {
            model: {
                id: 'person',
                label: 'Person',
                description: 'Someone the site shows: on the team, writing, speaking.',
                modelType: 'content',
                fields: {
                    name: { type: 'core/text', label: 'Name', options: { required: true } },
                    role: { type: 'core/text', label: 'Role', options: { multilingual: true } },
                    portrait: { type: 'core/asset', label: 'Portrait' },
                    bio: { type: 'core/textarea', label: 'Bio', options: { multilingual: true } },
                    email: { type: 'core/email', label: 'Email' },
                    website: { type: 'core/link', label: 'Website' },
                }
            }
        }
    },
    {
        id: 'event',
        name: 'Event',
        description: 'Things that happen at a time and place: talks, openings, workshops.',
        kind: 'model',
        template: {
            model: {
                id: 'event',
                label: 'Event',
                description: 'Something that happens at a time and a place.',
                modelType: 'content',
                fields: {
                    title: { type: 'core/text', label: 'Title', options: { required: true, multilingual: true } },
                    starts: { type: 'core/datetime', label: 'Starts', options: { required: true } },
                    ends: { type: 'core/datetime', label: 'Ends' },
                    place: { type: 'core/text', label: 'Place', options: { multilingual: true } },
                    summary: { type: 'core/textarea', label: 'Summary', options: { multilingual: true } },
                    picture: { type: 'core/asset', label: 'Picture' },
                    tickets: { type: 'core/link', label: 'Tickets' },
                }
            }
        }
    },
    {
        id: 'product',
        name: 'Product',
        description: 'What a site sells or shows: a name, a price, pictures, a description.',
        kind: 'model',
        template: {
            model: {
                id: 'product',
                label: 'Product',
                description: 'Something the site sells or shows.',
                modelType: 'content',
                fields: {
                    name: { type: 'core/text', label: 'Name', options: { required: true, multilingual: true } },
                    price: { type: 'core/number', label: 'Price' },
                    pictures: { type: 'core/asset-list', label: 'Pictures' },
                    summary: { type: 'core/textarea', label: 'Summary', options: { multilingual: true } },
                    description: { type: 'core/rich-text', label: 'Description', options: { multilingual: true } },
                    link: { type: 'core/link', label: 'Buy or read more' },
                }
            }
        }
    },
    {
        id: 'question',
        name: 'Question',
        description: 'Questions and their answers, for an FAQ.',
        kind: 'model',
        template: {
            model: {
                id: 'question',
                label: 'Question',
                description: 'A question and its answer.',
                modelType: 'content',
                fields: {
                    question: { type: 'core/text', label: 'Question', options: { required: true, multilingual: true } },
                    answer: { type: 'core/rich-text', label: 'Answer', options: { required: true, multilingual: true } },
                }
            }
        }
    },
    {
        id: 'testimonial',
        name: 'Testimonial',
        description: 'What clients say, with who said it.',
        kind: 'model',
        template: {
            model: {
                id: 'testimonial',
                label: 'Testimonial',
                description: 'What someone said, and who.',
                modelType: 'content',
                fields: {
                    quote: { type: 'core/textarea', label: 'Quote', options: { required: true, multilingual: true } },
                    name: { type: 'core/text', label: 'Name', options: { required: true } },
                    role: { type: 'core/text', label: 'Role', options: { multilingual: true } },
                    portrait: { type: 'core/asset', label: 'Portrait' },
                }
            }
        }
    },
    {
        id: 'place',
        name: 'Place',
        description: 'Addresses: shops, offices, venues.',
        kind: 'model',
        template: {
            model: {
                id: 'place',
                label: 'Place',
                description: 'An address the site shows: a shop, an office, a venue.',
                modelType: 'content',
                fields: {
                    name: { type: 'core/text', label: 'Name', options: { required: true, multilingual: true } },
                    address: { type: 'core/address', label: 'Address' },
                    hours: { type: 'core/textarea', label: 'Opening hours', options: { multilingual: true } },
                    phone: { type: 'core/phone', label: 'Phone' },
                    picture: { type: 'core/asset', label: 'Picture' },
                }
            }
        }
    },
    {
        id: 'job-opening',
        name: 'Job opening',
        description: 'Positions to fill, each with its description and how to apply.',
        kind: 'model',
        template: {
            model: {
                id: 'job',
                label: 'Job opening',
                description: 'A position to fill.',
                modelType: 'content',
                fields: {
                    title: { type: 'core/text', label: 'Title', options: { required: true, multilingual: true } },
                    place: { type: 'core/text', label: 'Where', options: { multilingual: true } },
                    summary: { type: 'core/textarea', label: 'Summary', options: { multilingual: true } },
                    description: { type: 'core/rich-text', label: 'Description', options: { multilingual: true } },
                    apply: { type: 'core/link', label: 'How to apply' },
                    closes: { type: 'core/date', label: 'Applications close' },
                }
            }
        }
    },
    {
        id: 'seo',
        name: 'SEO',
        description: 'Search engine optimization fields for entries or pages.',
        kind: 'structure',
        template: {
            structure: {
                type: 'seo',
                label: 'SEO',
                description: 'Search engine optimization fields.',
                fields: {
                    seoTitle: { type: 'core/text', label: 'SEO Title', options: { multilingual: true } },
                    seoDescription: { type: 'core/text', label: 'SEO Description', options: { multilingual: true, ui: 'textarea' } },
                    seoImage: { type: 'core/asset', label: 'SEO Image' },
                    canonicalUrl: { type: 'core/url', label: 'Canonical URL' }
                }
            }
        }
    },
    {
        id: 'default',
        name: 'Default Page',
        description: 'Basic page with title and content. Use for generic pages.',
        kind: 'template',
        template: {
            template: {
                id: 'default',
                label: 'Default Page',
                description: 'Basic page with title and content',
                fields: {
                    title: { type: 'core/text', label: 'Title' },
                    content: { type: 'core/rich-text', label: 'Content' }
                }
            }
        }
    },
    {
        id: 'publishable',
        name: 'Publishable',
        description: 'Fields for publishing status and slugs. Add to models or structures that need draft/published workflow.',
        kind: 'structure',
        template: {
            structure: {
                type: 'publishable',
                label: 'Publishable',
                description: 'Fields that control publishing status and slugs.',
                fields: {
                    status: {
                        type: 'core/select',
                        label: 'Status',
                        options: {
                            choices: [
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                                { value: 'archived', label: 'Archived' }
                            ],
                            allowEmpty: false
                        }
                    },
                    slug: {
                        type: 'core/text',
                        label: 'Slug',
                        description: 'URL-friendly identifier.',
                        options: { multilingual: false }
                    },
                    publishDate: { type: 'core/text', label: 'Publish Date', options: { multilingual: false } }
                }
            }
        }
    },
    {
        id: 'landing',
        name: 'Landing Page',
        description: 'Hero, features, and CTA. Good for marketing or product pages.',
        kind: 'template',
        template: {
            template: {
                id: 'landing',
                label: 'Landing Page',
                description: 'Hero, features, CTA',
                fields: {
                    heroTitle: { type: 'core/text', label: 'Hero Title' },
                    heroSubtitle: { type: 'core/rich-text', label: 'Hero Subtitle' },
                    ctaLabel: { type: 'core/text', label: 'CTA Button Label' },
                    ctaUrl: { type: 'core/link', label: 'CTA URL' }
                }
            }
        }
    },
    {
        id: 'article',
        name: 'Article',
        description: 'Title, block body, and author. Suited for news or blog-style content.',
        kind: 'template',
        template: {
            template: {
                id: 'article',
                label: 'Article',
                description: 'Title, block body, author',
                fields: {
                    title: { type: 'core/text', label: 'Title' },
                    body: {
                        type: 'core/block-list',
                        label: 'Body',
                        description: 'Ordered block instances (paragraphs, headings, media, etc.).',
                        options: { allowEmpty: false }
                    },
                    author: { type: 'core/text', label: 'Author' }
                }
            }
        }
    }
];
