/** Restaurant: the menu by section, hours, the address and a booking form, for a café or a shop. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import {
    base,
    currencyField,
    bundle,
    files,
    homePage,
    hoursField,
    indexPage,
    indexTemplate,
    menu,
    page,
    picture,
    relation,
    t,
    text,
    textarea
} from './base.js';

const shared = base({
    siteName: 'Café Rivière',
    tagline: t('Breakfast and lunch by the water.', 'Déjeuners et dîners au bord de l’eau.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    fields: { currency: currencyField() },
    words: {
        hours: [t('“Opening hours” heading', 'Titre « Heures d’ouverture »'), t('Opening hours', 'Heures d’ouverture')],
        closed: [t('Closed', 'Fermé'), t('Closed', 'Fermé')],
        vegetarian: [t('Vegetarian mark', 'Mention végétarienne'), t('Vegetarian', 'Végétarien')]
    }
});

const models = [
    {
        id: 'section',
        label: t('Menu section', 'Section du menu'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            note: text(t('Note', 'Note')),
            order: { type: 'core/number', label: t('Order', 'Ordre') }
        }
    },
    {
        id: 'dish',
        label: t('Dish', 'Plat'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            description: textarea(t('Description', 'Description')),
            price: {
                type: 'core/number',
                label: t('Price', 'Prix'),
                options: { min: 0, step: 0.01 }
            },
            section: relation(t('Section', 'Section'), 'section', { required: true }),
            vegetarian: {
                type: 'core/boolean',
                label: t('Vegetarian', 'Végétarien')
            },
            photo: picture(t('Photo', 'Photo')),
            order: { type: 'core/number', label: t('Order', 'Ordre') }
        }
    },
    {
        id: 'location',
        label: t('Location', 'Adresse'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            address: { type: 'core/address', label: t('Address', 'Adresse') },
            phone: { type: 'core/phone', label: t('Phone', 'Téléphone') },
            hours: hoursField()
        }
    }
] as ModelSchema[];

const booking = {
    id: 'booking',
    label: 'Booking',
    description: 'Table requests.',
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
        phone: { type: 'core/phone', label: t('Phone', 'Téléphone') },
        date: {
            type: 'core/datetime',
            label: t('Date and time', 'Date et heure'),
            options: { required: true }
        },
        guests: {
            type: 'core/number',
            label: t('Guests', 'Personnes'),
            options: { required: true, min: 1, max: 12 }
        },
        note: {
            type: 'core/textarea',
            label: t('Anything we should know', 'Quelque chose à savoir')
        }
    }
};

const day = (en: string, fr: string) => t(en, fr);
export const restaurantBlueprint: BlueprintSchema = {
    id: 'restaurant',
    name: 'Restaurant',
    description:
        'A menu by section with prices, hours, the address and a booking form, for a restaurant, a café or a shop.',
    kind: 'project',
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [indexTemplate('menu', t('Menu', 'Menu')), indexTemplate('visit', t('Visit', 'Nous trouver'))],
        assets: files({
            name: 'restaurant',
            alt: 'Warm red light',
            title: 'Café Rivière'
        }),
        forms: [booking],
        pages: [
            homePage({
                title: t('Breakfast and lunch by the water', 'Déjeuners et dîners au bord de l’eau'),
                text: ['Open every morning but Monday.', 'Ouvert tous les matins sauf le lundi.'],
                image: 'restaurant',
                link: ['menu', t('See the menu', 'Voir le menu')],
                body: [
                    'The menu, prices and hours are content: change a price in the Studio and the site follows.',
                    'Le menu, les prix et les heures sont du contenu : changez un prix dans le Studio, le site suit.'
                ],
                description: t('Breakfast and lunch by the water.', 'Déjeuners et dîners au bord de l’eau.')
            }),
            indexPage(
                'menu',
                'Menu',
                ['menu', 'menu'],
                t('Menu', 'Menu'),
                t('Made here, every morning.', 'Fait ici, chaque matin.')
            ),
            indexPage(
                'visit',
                'Visit',
                ['visit', 'nous-trouver'],
                t('Visit us', 'Nous trouver'),
                t('Hours and address.', 'Heures et adresse.')
            ),
            page('book', 'Book', 'book', 'reserver', {
                title: t('Book a table', 'Réserver une table'),
                lede: t('We confirm by email within the day.', 'Nous confirmons par courriel dans la journée.'),
                blocks: [{ type: 'form', data: { form: 'booking' } }]
            })
        ],
        entries: {
            section: [
                {
                    id: 'breakfast',
                    published: true,
                    data: {
                        name: t('Breakfast', 'Déjeuner'),
                        note: t('Until 11:00', 'Jusqu’à 11 h'),
                        order: 1
                    }
                },
                {
                    id: 'lunch',
                    published: true,
                    data: { name: t('Lunch', 'Dîner'), order: 2 }
                }
            ],
            dish: [
                {
                    id: 'eggs',
                    published: true,
                    data: {
                        name: t('Eggs and toast', 'Œufs et rôties'),
                        description: t('Two eggs, sourdough, potatoes.', 'Deux œufs, pain au levain, patates.'),
                        price: 14,
                        section: { $ref: 'entry:section/breakfast' },
                        vegetarian: true,
                        order: 1
                    }
                },
                {
                    id: 'pancakes',
                    published: true,
                    data: {
                        name: t('Pancakes', 'Crêpes'),
                        description: t('With maple syrup and berries.', 'Au sirop d’érable et aux petits fruits.'),
                        price: 13,
                        section: { $ref: 'entry:section/breakfast' },
                        vegetarian: true,
                        order: 2
                    }
                },
                {
                    id: 'soup',
                    published: true,
                    data: {
                        name: t('Soup of the day', 'Soupe du jour'),
                        price: 8,
                        section: { $ref: 'entry:section/lunch' },
                        order: 1
                    }
                },
                {
                    id: 'sandwich',
                    published: true,
                    data: {
                        name: t('Trout sandwich', 'Sandwich à la truite'),
                        description: t('Smoked trout, herbs, pickles.', 'Truite fumée, herbes, marinades.'),
                        price: 17,
                        section: { $ref: 'entry:section/lunch' },
                        order: 2
                    }
                }
            ],
            location: [
                {
                    id: 'main',
                    published: true,
                    data: {
                        name: t('Café Rivière', 'Café Rivière'),
                        address: {
                            street: '12 Water Street',
                            city: 'Québec',
                            state: 'QC',
                            country: 'CA',
                            postalCode: 'G1K 3X2'
                        },
                        phone: '+1 418 555 0123',
                        hours: {
                            tuesday: day('7:00 to 15:00', '7 h à 15 h'),
                            wednesday: day('7:00 to 15:00', '7 h à 15 h'),
                            thursday: day('7:00 to 15:00', '7 h à 15 h'),
                            friday: day('7:00 to 15:00', '7 h à 15 h'),
                            saturday: day('8:00 to 16:00', '8 h à 16 h'),
                            sunday: day('8:00 to 16:00', '8 h à 16 h')
                        }
                    }
                }
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['menu', t('Menu', 'Menu')],
                ['visit', t('Visit', 'Nous trouver')],
                ['book', t('Book', 'Réserver')]
            ])
        ]
    })
};
