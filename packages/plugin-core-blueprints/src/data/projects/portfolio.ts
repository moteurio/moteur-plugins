/** Portfolio: projects with their pictures, clients and services, for a studio or an artist. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import {
    base,
    bundle,
    collectionPage,
    contactForm,
    files,
    homePage,
    menu,
    page,
    paragraphs,
    pic,
    picture,
    relation,
    relations,
    rich,
    seoField,
    slug,
    t,
    text,
    textarea
} from './base.js';

const shared = base({
    siteName: 'Studio Ardoise',
    tagline: t('Identity and spaces for people who make things.', 'Identités et lieux pour ceux qui fabriquent.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    words: {
        client: [t('“Client” label', 'Libellé « Client »'), t('Client', 'Client')],
        year: [t('“Year” label', 'Libellé « Année »'), t('Year', 'Année')],
        services: [t('“Services” label', 'Libellé « Services »'), t('Services', 'Services')],
        nextProject: [t('Link to the next project', 'Lien vers le projet suivant'), t('Next project', 'Projet suivant')]
    }
});

const models = [
    {
        id: 'project',
        label: t('Project', 'Projet'),
        fields: {
            title: text(t('Title', 'Titre'), { required: true }),
            slug: slug(),
            year: {
                type: 'core/number',
                label: t('Year', 'Année'),
                options: { min: 1900, max: 2100 }
            },
            summary: textarea(t('Summary', 'Résumé'), { maxLength: 240 }),
            cover: picture(t('Cover', 'Couverture'), { required: true }),
            gallery: { type: 'core/asset-list', label: t('Pictures', 'Images') },
            body: rich(t('Text', 'Texte')),
            client: relation(t('Client', 'Client'), 'client'),
            services: relations(t('Services', 'Services'), 'service'),
            featured: {
                type: 'core/boolean',
                label: t('On the home page', 'Sur l’accueil')
            },
            seo: seoField()
        }
    },
    {
        id: 'client',
        label: t('Client', 'Client'),
        fields: {
            name: {
                type: 'core/text',
                label: t('Name', 'Nom'),
                options: { required: true }
            },
            website: { type: 'core/url', label: t('Website', 'Site web') }
        }
    },
    {
        id: 'service',
        label: t('Service', 'Service'),
        fields: { name: text(t('Name', 'Nom'), { required: true }) }
    }
] as ModelSchema[];

export const portfolioBlueprint: BlueprintSchema = {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Projects with their pictures, clients and services, for a studio, an architect or an artist.',
    kind: 'project',
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [
            {
                id: 'work',
                label: t('Work', 'Réalisations'),
                fields: {
                    title: text(t('Title', 'Titre'), { required: true }),
                    lede: text(t('Lede', 'Chapô')),
                    seo: seoField()
                }
            }
        ],
        assets: files(
            {
                name: 'portfolio',
                alt: 'Grey light, a dark circle',
                title: 'Studio Ardoise'
            },
            { name: 'site', alt: 'Soft green light', title: 'Green' },
            { name: 'catalog', alt: 'Ochre light', title: 'Ochre' }
        ),
        forms: [contactForm()],
        pages: [
            homePage({
                title: t('Identity and spaces', 'Identités et lieux'),
                text: [
                    'For people who make things: bakers, printers, small brands.',
                    'Pour ceux qui fabriquent : boulangers, imprimeurs, petites marques.'
                ],
                image: 'portfolio',
                link: ['work', t('See the work', 'Voir les réalisations')],
                body: [
                    'Each project has its pictures, its client and its services. Mark some to show them on the home page.',
                    'Chaque projet a ses images, son client et ses services. Cochez-en quelques-uns pour les montrer sur l’accueil.'
                ],
                description: t(
                    'Identity and spaces for people who make things.',
                    'Identités et lieux pour ceux qui fabriquent.'
                )
            }),
            {
                ...collectionPage(
                    'work',
                    'Work',
                    ['work', 'realisations'],
                    'project',
                    t('Work', 'Réalisations'),
                    t('Selected projects.', 'Projets choisis.')
                ),
                templateId: 'work'
            },
            page('studio', 'Studio', 'studio', 'studio', {
                title: t('The studio', 'Le studio'),
                lede: t('Three people, one long table.', 'Trois personnes, une grande table.'),
                blocks: [
                    {
                        type: 'text',
                        data: {
                            body: paragraphs(
                                ['Say how you work and with whom.'],
                                ['Dites comment vous travaillez, et avec qui.']
                            )
                        }
                    },
                    {
                        type: 'form',
                        data: {
                            title: t('Start a project', 'Commencer un projet'),
                            form: 'contact'
                        }
                    }
                ]
            })
        ],
        entries: {
            client: [
                {
                    id: 'cote',
                    published: true,
                    data: { name: 'Boulangerie Côté', website: 'https://example.com' }
                },
                { id: 'presse', published: true, data: { name: 'Presse Nord' } }
            ],
            service: [
                {
                    id: 'identity',
                    published: true,
                    data: { name: t('Identity', 'Identité') }
                },
                {
                    id: 'interiors',
                    published: true,
                    data: { name: t('Interiors', 'Aménagement') }
                }
            ],
            project: [
                {
                    id: 'bakery',
                    published: true,
                    data: {
                        title: t('A bakery’s new face', 'Le nouveau visage d’une boulangerie'),
                        slug: t('bakery', 'boulangerie'),
                        year: 2026,
                        summary: t('Signs, bags and a counter.', 'Enseigne, sacs et comptoir.'),
                        cover: pic('catalog'),
                        gallery: [pic('portfolio'), pic('site')],
                        body: paragraphs(
                            ['Tell the project: the brief, the work, the result.'],
                            ['Racontez le projet : la demande, le travail, le résultat.']
                        ),
                        client: { $ref: 'entry:client/cote' },
                        services: [{ $ref: 'entry:service/identity' }, { $ref: 'entry:service/interiors' }],
                        featured: true
                    }
                },
                {
                    id: 'printer',
                    published: true,
                    data: {
                        title: t('A printer’s catalogue', 'Le catalogue d’un imprimeur'),
                        slug: t('printer', 'imprimeur'),
                        year: 2025,
                        summary: t('Forty pages, two inks.', 'Quarante pages, deux encres.'),
                        cover: pic('site'),
                        body: paragraphs(['Tell the project.'], ['Racontez le projet.']),
                        client: { $ref: 'entry:client/presse' },
                        services: [{ $ref: 'entry:service/identity' }],
                        featured: true
                    }
                }
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['work', t('Work', 'Réalisations')],
                ['studio', t('Studio', 'Studio')]
            ])
        ]
    })
};
