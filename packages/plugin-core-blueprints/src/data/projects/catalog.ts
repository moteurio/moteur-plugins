/** Catalog: products in categories, with pictures and specifications, and a request form. No cart. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import {
    base,
    bundle,
    collectionPage,
    files,
    homePage,
    indexPage,
    indexTemplate,
    menu,
    page,
    paragraphs,
    pic,
    picture,
    relation,
    rich,
    seoField,
    slug,
    t,
    text,
    textarea
} from './base.js';

const shared = base({
    siteName: 'Maison Bois',
    tagline: t('Furniture made to order, in solid wood.', 'Du mobilier sur mesure, en bois massif.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    words: {
        currency: [t('Currency (ISO code)', 'Devise (code ISO)'), t('CAD', 'CAD')],
        from: [t('“From” before a price', '« À partir de » avant un prix'), t('From', 'À partir de')],
        request: [t('Request button', 'Bouton de demande'), t('Ask for a quote', 'Demander une soumission')],
        specs: [t('“Specifications” heading', 'Titre « Caractéristiques »'), t('Specifications', 'Caractéristiques')]
    }
});

const models = [
    {
        id: 'category',
        label: t('Category', 'Catégorie'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            description: textarea(t('Description', 'Description')),
            image: picture(t('Picture', 'Image')),
            order: { type: 'core/number', label: t('Order', 'Ordre') }
        }
    },
    {
        id: 'product',
        label: t('Product', 'Produit'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            slug: slug(),
            reference: { type: 'core/text', label: t('Reference', 'Référence') },
            category: relation(t('Category', 'Catégorie'), 'category', {
                required: true
            }),
            price: {
                type: 'core/number',
                label: t('Price from', 'Prix à partir de'),
                options: { min: 0, step: 0.01 }
            },
            summary: textarea(t('Summary', 'Résumé'), { maxLength: 240 }),
            pictures: {
                type: 'core/asset-list',
                label: t('Pictures', 'Images'),
                options: { minItems: 1 }
            },
            body: rich(t('Description', 'Description')),
            specs: {
                type: 'core/list',
                label: t('Specifications', 'Caractéristiques'),
                items: {
                    type: 'core/object',
                    label: t('Specification', 'Caractéristique'),
                    fields: {
                        name: text(t('Name', 'Nom'), { required: true }),
                        value: text(t('Value', 'Valeur'), { required: true })
                    }
                }
            },
            seo: seoField()
        }
    }
] as ModelSchema[];

const request = {
    id: 'quote',
    label: 'Quote request',
    description: 'Quote requests from product pages.',
    honeypot: true,
    fields: {
        name: {
            type: 'core/text',
            label: t('Name', 'Nom'),
            options: { required: true }
        },
        email: {
            type: 'core/email',
            label: t('Email', 'Courriel'),
            options: { required: true }
        },
        product: { type: 'core/text', label: t('Product', 'Produit') },
        message: {
            type: 'core/textarea',
            label: t('What you have in mind', 'Ce que vous avez en tête'),
            options: { required: true }
        }
    }
};

const spec = (name: [string, string], value: [string, string]) => ({
    name: t(...name),
    value: t(...value)
});

export const catalogBlueprint: BlueprintSchema = {
    id: 'catalog',
    name: 'Catalog',
    description: 'Products in categories, with pictures, specifications and a quote request: a catalog without a cart.',
    kind: 'project',
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [indexTemplate('catalog', t('Catalog', 'Catalogue'))],
        assets: files(
            { name: 'catalog', alt: 'Ochre light', title: 'Maison Bois' },
            { name: 'portfolio', alt: 'Grey light', title: 'Grey' }
        ),
        forms: [request],
        pages: [
            homePage({
                title: t('Made to order, in solid wood', 'Sur mesure, en bois massif'),
                text: [
                    'Tables, chairs and shelves, made in our workshop.',
                    'Tables, chaises et étagères, faites dans notre atelier.'
                ],
                image: 'catalog',
                link: ['catalog', t('See the catalog', 'Voir le catalogue')],
                body: [
                    'Products are entries in categories: each has its own page, its pictures and its specifications.',
                    'Les produits sont des entrées classées par catégorie : chacun a sa page, ses images et ses caractéristiques.'
                ],
                description: t('Furniture made to order, in solid wood.', 'Du mobilier sur mesure, en bois massif.')
            }),
            {
                ...collectionPage(
                    'catalog',
                    'Catalog',
                    ['catalog', 'catalogue'],
                    'product',
                    t('Catalog', 'Catalogue'),
                    t('Every piece can be made to your size.', 'Chaque pièce peut être faite à vos mesures.')
                ),
                templateId: 'catalog'
            },
            page('quote', 'Quote', 'quote', 'soumission', {
                title: t('Ask for a quote', 'Demander une soumission'),
                lede: t(
                    'Tell us what you need: we answer within three days.',
                    'Dites-nous ce qu’il vous faut : nous répondons en trois jours.'
                ),
                blocks: [{ type: 'form', data: { form: 'quote' } }]
            }),
            page('workshop', 'Workshop', 'workshop', 'atelier', {
                title: t('The workshop', 'L’atelier'),
                blocks: [
                    {
                        type: 'text',
                        data: {
                            body: paragraphs(
                                ['Say where you work, with which woods, and how long an order takes.'],
                                ['Dites où vous travaillez, avec quels bois, et combien de temps prend une commande.']
                            )
                        }
                    }
                ]
            })
        ],
        entries: {
            category: [
                {
                    id: 'tables',
                    published: true,
                    data: {
                        name: t('Tables', 'Tables'),
                        description: t('Dining, coffee and work tables.', 'Tables à manger, de salon et de travail.'),
                        order: 1
                    }
                },
                {
                    id: 'shelves',
                    published: true,
                    data: { name: t('Shelves', 'Étagères'), order: 2 }
                }
            ],
            product: [
                {
                    id: 'long-table',
                    published: true,
                    data: {
                        name: t('Long table', 'Grande table'),
                        slug: t('long-table', 'grande-table'),
                        reference: 'T-220',
                        category: { $ref: 'entry:category/tables' },
                        price: 2400,
                        summary: t('Seats eight, in oak or maple.', 'Huit places, en chêne ou en érable.'),
                        pictures: [pic('catalog')],
                        body: paragraphs(
                            ['Describe the piece: its wood, its finish, how it is made.'],
                            ['Décrivez la pièce : son bois, sa finition, sa fabrication.']
                        ),
                        specs: [
                            spec(['Length', 'Longueur'], ['220 cm', '220 cm']),
                            spec(['Wood', 'Bois'], ['Oak or maple', 'Chêne ou érable'])
                        ]
                    }
                },
                {
                    id: 'wall-shelf',
                    published: true,
                    data: {
                        name: t('Wall shelf', 'Étagère murale'),
                        slug: t('wall-shelf', 'etagere-murale'),
                        reference: 'S-90',
                        category: { $ref: 'entry:category/shelves' },
                        price: 380,
                        summary: t('Three shelves, hidden fixings.', 'Trois tablettes, fixations cachées.'),
                        pictures: [pic('portfolio')],
                        specs: [spec(['Width', 'Largeur'], ['90 cm', '90 cm'])]
                    }
                }
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['catalog', t('Catalog', 'Catalogue')],
                ['workshop', t('Workshop', 'Atelier')],
                ['quote', t('Quote', 'Soumission')]
            ])
        ]
    })
};
