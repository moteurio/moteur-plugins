/** Events: events with dates, venues and speakers, for a venue, a festival or an association. */
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
    siteName: 'Les Mardis',
    tagline: t('Talks and evenings, every other Tuesday.', 'Causeries et soirées, un mardi sur deux.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    words: {
        upcoming: [t('“Upcoming” heading', 'Titre « À venir »'), t('Upcoming', 'À venir')],
        past: [t('“Past” heading', 'Titre « Passés »'), t('Past', 'Passés')],
        tickets: [t('Tickets button', 'Bouton des billets'), t('Tickets', 'Billets')],
        free: [t('Free', 'Gratuit'), t('Free', 'Gratuit')],
        speakers: [t('“Speakers” heading', 'Titre « Intervenants »'), t('Speakers', 'Intervenants')]
    }
});

const models = [
    {
        id: 'event',
        label: t('Event', 'Événement'),
        fields: {
            title: text(t('Title', 'Titre'), { required: true }),
            slug: slug(),
            starts: {
                type: 'core/datetime',
                label: t('Starts', 'Début'),
                options: { required: true }
            },
            ends: { type: 'core/datetime', label: t('Ends', 'Fin') },
            summary: textarea(t('Summary', 'Résumé'), { maxLength: 240 }),
            cover: picture(t('Cover', 'Couverture')),
            body: rich(t('Text', 'Texte')),
            venue: relation(t('Venue', 'Lieu'), 'venue'),
            speakers: relations(t('Speakers', 'Intervenants'), 'speaker'),
            price: {
                type: 'core/number',
                label: t('Price (empty: free)', 'Prix (vide : gratuit)'),
                options: { min: 0, step: 0.01 }
            },
            tickets: {
                type: 'core/url',
                label: t('Tickets link', 'Lien des billets')
            },
            seo: seoField()
        }
    },
    {
        id: 'venue',
        label: t('Venue', 'Lieu'),
        fields: {
            name: {
                type: 'core/text',
                label: t('Name', 'Nom'),
                options: { required: true }
            },
            address: { type: 'core/address', label: t('Address', 'Adresse') },
            access: textarea(t('Getting there', 'Pour s’y rendre'))
        }
    },
    {
        id: 'speaker',
        label: t('Speaker', 'Intervenant'),
        fields: {
            name: {
                type: 'core/text',
                label: t('Name', 'Nom'),
                options: { required: true }
            },
            role: text(t('Role', 'Rôle')),
            photo: picture(t('Photo', 'Photo')),
            bio: textarea(t('Bio', 'Biographie'))
        }
    }
] as ModelSchema[];

export const eventsBlueprint: BlueprintSchema = {
    id: 'events',
    name: 'Events',
    description: 'Events with dates, venues, speakers and tickets, for a venue, a festival or an association.',
    kind: 'project',
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [
            {
                id: 'events',
                label: t('Events', 'Événements'),
                fields: {
                    title: text(t('Title', 'Titre'), { required: true }),
                    lede: text(t('Lede', 'Chapô')),
                    seo: seoField()
                }
            }
        ],
        assets: files(
            { name: 'events', alt: 'Teal light', title: 'Les Mardis' },
            { name: 'person-1', alt: 'Portrait', title: 'Portrait' },
            { name: 'person-2', alt: 'Portrait', title: 'Portrait' }
        ),
        forms: [contactForm()],
        pages: [
            homePage({
                title: t('Talks and evenings', 'Causeries et soirées'),
                text: [
                    'Every other Tuesday, at the library or the park.',
                    'Un mardi sur deux, à la bibliothèque ou au parc.'
                ],
                image: 'events',
                link: ['events', t('See what’s on', 'Voir la programmation')],
                body: [
                    'Events are entries with their dates: the site sorts them into upcoming and past by itself.',
                    'Les événements sont des entrées avec leurs dates : le site les classe lui-même en à venir et passés.'
                ],
                description: t('Talks and evenings, every other Tuesday.', 'Causeries et soirées, un mardi sur deux.')
            }),
            {
                ...collectionPage(
                    'events',
                    'Events',
                    ['events', 'evenements'],
                    'event',
                    t('What’s on', 'Programmation'),
                    t('Upcoming first.', 'Les prochains d’abord.')
                ),
                templateId: 'events'
            },
            page('about', 'About', 'about', 'a-propos', {
                title: t('About', 'À propos'),
                lede: t('Who organizes, and how to take part.', 'Qui organise, et comment participer.'),
                blocks: [
                    {
                        type: 'text',
                        data: {
                            body: paragraphs(
                                ['Say who you are and how people can propose a talk.'],
                                ['Dites qui vous êtes et comment proposer une causerie.']
                            )
                        }
                    },
                    {
                        type: 'form',
                        data: { title: t('Write to us', 'Écrivez-nous'), form: 'contact' }
                    }
                ]
            })
        ],
        entries: {
            venue: [
                {
                    id: 'library',
                    published: true,
                    data: {
                        name: 'Bibliothèque centrale',
                        address: {
                            street: '50 Library Lane',
                            city: 'Montréal',
                            state: 'QC',
                            country: 'CA'
                        },
                        access: t('Metro Berri, then a five-minute walk.', 'Métro Berri, puis cinq minutes à pied.')
                    }
                }
            ],
            speaker: [
                {
                    id: 'ines',
                    published: true,
                    data: {
                        name: 'Inès Gagnon',
                        role: t('Urban gardener', 'Jardinière urbaine'),
                        photo: pic('person-1'),
                        bio: t('Grows food on rooftops.', 'Cultive sur les toits.')
                    }
                },
                {
                    id: 'paul',
                    published: true,
                    data: {
                        name: 'Paul Mensah',
                        role: t('Historian', 'Historien'),
                        photo: pic('person-2'),
                        bio: t('Walks the city’s old streets.', 'Arpente les vieilles rues de la ville.')
                    }
                }
            ],
            event: [
                {
                    id: 'rooftops',
                    published: true,
                    data: {
                        title: t('Gardens on the roofs', 'Des jardins sur les toits'),
                        slug: t('gardens-on-the-roofs', 'jardins-sur-les-toits'),
                        starts: '2027-03-09T23:00:00Z',
                        ends: '2027-03-10T01:00:00Z',
                        summary: t('What grows forty metres up.', 'Ce qui pousse à quarante mètres.'),
                        cover: pic('events'),
                        body: paragraphs(['Describe the evening.'], ['Décrivez la soirée.']),
                        venue: { $ref: 'entry:venue/library' },
                        speakers: [{ $ref: 'entry:speaker/ines' }]
                    }
                },
                {
                    id: 'old-streets',
                    published: true,
                    data: {
                        title: t('The old streets', 'Les vieilles rues'),
                        slug: t('the-old-streets', 'les-vieilles-rues'),
                        starts: '2026-10-13T22:00:00Z',
                        summary: t('A walk through three centuries.', 'Une promenade à travers trois siècles.'),
                        body: paragraphs(['Describe the evening.'], ['Décrivez la soirée.']),
                        venue: { $ref: 'entry:venue/library' },
                        speakers: [{ $ref: 'entry:speaker/paul' }],
                        price: 10,
                        tickets: 'https://example.com/tickets'
                    }
                }
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['events', t('What’s on', 'Programmation')],
                ['about', t('About', 'À propos')]
            ])
        ]
    })
};
