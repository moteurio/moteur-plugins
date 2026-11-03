/** Site: pages and a contact form. The simplest starting point, for a company or a person. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import { base, contactForm, files, page, paragraphs, pic, t } from './base.js';

const shared = base({
    siteName: 'Northfield',
    tagline: t('A small company, clearly explained.', 'Une petite entreprise, clairement expliquée.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.')
});

export const siteBlueprint: BlueprintSchema = {
    id: 'site',
    name: 'Site',
    description: 'Pages with blocks, a contact form and the site’s settings: the simplest starting point.',
    kind: 'project',
    firstProject: true,
    languages: ['en', 'fr'],
    bundle: {
        version: 1,
        structures: shared.structures,
        blocks: shared.blocks,
        models: shared.models,
        templates: shared.templates,
        assets: files({
            name: 'site',
            alt: 'Soft green light',
            title: 'Northfield'
        }),
        forms: [contactForm()],
        pages: [
            {
                id: 'home',
                label: 'Home',
                slug: '',
                templateId: 'home',
                published: true,
                fields: {
                    blocks: [
                        {
                            type: 'hero',
                            data: {
                                title: t('We make things that last', 'Nous faisons des choses qui durent'),
                                text: paragraphs(
                                    ['Say in one or two sentences what you do and for whom.'],
                                    ['Dites en une ou deux phrases ce que vous faites, et pour qui.']
                                ),
                                image: pic('site'),
                                link: {
                                    pageId: { $ref: 'page:contact' },
                                    label: t('Get in touch', 'Nous écrire')
                                }
                            }
                        },
                        {
                            type: 'text',
                            data: {
                                body: paragraphs(
                                    [
                                        'Every page is made of blocks: a hero, text, a picture, a form. Add, remove and reorder them in the Studio.'
                                    ],
                                    [
                                        'Chaque page est faite de blocs : un bandeau, du texte, une image, un formulaire. Ajoutez-les, retirez-les et réordonnez-les dans le Studio.'
                                    ]
                                )
                            }
                        }
                    ],
                    seo: {
                        description: t(
                            'A small company, clearly explained.',
                            'Une petite entreprise, clairement expliquée.'
                        )
                    }
                }
            },
            page('about', 'About', 'about', 'a-propos', {
                title: t('About us', 'À propos'),
                lede: t('Who we are, and how we work.', 'Qui nous sommes, et comment nous travaillons.'),
                blocks: [
                    {
                        type: 'picture',
                        data: {
                            image: pic('site'),
                            caption: t('Our workshop.', 'Notre atelier.')
                        }
                    },
                    {
                        type: 'text',
                        data: {
                            body: paragraphs(
                                ['Tell your story here: where you started, what you care about, who you work with.'],
                                [
                                    'Racontez votre histoire ici : vos débuts, ce qui vous tient à cœur, avec qui vous travaillez.'
                                ]
                            )
                        }
                    }
                ]
            }),
            page('contact', 'Contact', 'contact', 'contact', {
                title: t('Contact', 'Contact'),
                lede: t('Write to us: we answer within two days.', 'Écrivez-nous : nous répondons en deux jours.'),
                blocks: [{ type: 'form', data: { form: 'contact' } }]
            }),
            page(
                'privacy',
                'Privacy',
                'privacy',
                'confidentialite',
                {
                    title: t('Privacy', 'Confidentialité'),
                    blocks: [
                        {
                            type: 'text',
                            data: {
                                body: paragraphs(
                                    ['Say what you collect through the contact form, why, and how long you keep it.'],
                                    [
                                        'Dites ce que vous recueillez par le formulaire de contact, pourquoi, et combien de temps vous le gardez.'
                                    ]
                                )
                            }
                        }
                    ]
                },
                { navInclude: false }
            )
        ],
        entries: { settings: [shared.settings] },
        menus: [
            {
                handle: 'main',
                label: 'Main',
                items: [
                    {
                        id: 'about',
                        label: t('About', 'À propos'),
                        linkType: 'page',
                        pageId: { $ref: 'page:about' }
                    },
                    {
                        id: 'contact',
                        label: t('Contact', 'Contact'),
                        linkType: 'page',
                        pageId: { $ref: 'page:contact' }
                    }
                ]
            },
            {
                handle: 'footer',
                label: 'Footer',
                items: [
                    {
                        id: 'privacy',
                        label: t('Privacy', 'Confidentialité'),
                        linkType: 'page',
                        pageId: { $ref: 'page:privacy' }
                    }
                ]
            }
        ]
    }
};
