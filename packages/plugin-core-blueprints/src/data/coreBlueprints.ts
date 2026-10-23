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
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Content model for a single blog post with title, excerpt, and body.',
        kind: 'model',
        template: {
            model: {
                id: 'post',
                label: 'Blog Post',
                description: 'A single blog post',
                modelType: 'content',
                fields: {
                    title: { type: 'core/text', label: 'Title', options: { multilingual: true } },
                    excerpt: { type: 'core/text', label: 'Excerpt', options: { multilingual: true, ui: 'textarea' } },
                    body: { type: 'core/rich-text', label: 'Body', options: { multilingual: true } }
                }
            }
        }
    },
    {
        id: 'basic-page',
        name: 'Basic Page',
        description: 'Simple content model for a basic page (title + body).',
        kind: 'model',
        template: {
            model: {
                id: 'page',
                label: 'Page',
                description: 'Basic page',
                modelType: 'content',
                fields: {
                    title: { type: 'core/text', label: 'Title', options: { multilingual: true } },
                    body: { type: 'core/rich-text', label: 'Body', options: { multilingual: true } }
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
                type: 'project/seo',
                label: 'SEO',
                description: 'Search engine optimization fields.',
                fields: {
                    seoTitle: { type: 'core/text', label: 'SEO Title', options: { multilingual: true } },
                    seoDescription: { type: 'core/text', label: 'SEO Description', options: { multilingual: true, ui: 'textarea' } },
                    seoImage: { type: 'core/image', label: 'SEO Image' },
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
                type: 'project/publishable',
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
