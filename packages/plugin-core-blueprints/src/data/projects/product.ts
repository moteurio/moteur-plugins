/** Product: features, plans, testimonials and questions, for software or a single product. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import {
    base,
    currencyField,
    bundle,
    contactForm,
    files,
    homePage,
    indexPage,
    indexTemplate,
    menu,
    page,
    paragraphs,
    picture,
    question,
    questionModel,
    rich,
    t,
    text,
    textarea
} from './base.js';

const shared = base({
    siteName: 'Tally',
    tagline: t('Time tracking a team actually fills in.', 'Le suivi du temps qu’une équipe remplit vraiment.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    fields: { currency: currencyField() },
    words: {
        perMonth: [t('“Per month” after a price', '« Par mois » après un prix'), t('per month', 'par mois')],
        choose: [t('Plan button', 'Bouton des forfaits'), t('Choose', 'Choisir')]
    }
});

const models = [
    {
        id: 'feature',
        label: t('Feature', 'Fonction'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            summary: textarea(t('Summary', 'Résumé'), { maxLength: 240 }),
            icon: { type: 'core/icon', label: t('Icon', 'Icône') },
            image: picture(t('Picture', 'Image')),
            order: { type: 'core/number', label: t('Order', 'Ordre') }
        }
    },
    {
        id: 'plan',
        label: t('Plan', 'Forfait'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            price: {
                type: 'core/number',
                label: t('Price per month', 'Prix par mois'),
                options: { min: 0, step: 0.01 }
            },
            summary: textarea(t('Summary', 'Résumé')),
            includes: {
                type: 'core/list',
                label: t('Includes', 'Comprend'),
                items: text(t('Item', 'Élément'))
            },
            highlighted: {
                type: 'core/boolean',
                label: t('Highlighted', 'Mis en avant')
            },
            link: { type: 'core/link', label: t('Button', 'Bouton') },
            order: { type: 'core/number', label: t('Order', 'Ordre') }
        }
    },
    {
        id: 'testimonial',
        label: t('Testimonial', 'Témoignage'),
        fields: {
            quote: textarea(t('Quote', 'Citation'), { required: true }),
            name: {
                type: 'core/text',
                label: t('Name', 'Nom'),
                options: { required: true }
            },
            company: { type: 'core/text', label: t('Company', 'Entreprise') }
        }
    },
    questionModel(),
    {
        id: 'release',
        label: t('Release note', 'Note de version'),
        fields: {
            version: {
                type: 'core/text',
                label: t('Version', 'Version'),
                options: { required: true }
            },
            date: {
                type: 'core/date',
                label: t('Date', 'Date'),
                options: { required: true }
            },
            body: rich(t('What changed', 'Ce qui a changé'))
        }
    }
] as ModelSchema[];

export const productBlueprint: BlueprintSchema = {
    id: 'product',
    name: 'Product',
    description:
        'Features, plans and prices, testimonials, questions and release notes, for software or a single product.',
    kind: 'project',
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [
            indexTemplate('features', t('Features', 'Fonctions')),
            indexTemplate('pricing', t('Pricing', 'Tarifs')),
            indexTemplate('faq', t('Questions', 'Questions')),
            indexTemplate('changelog', t('Release notes', 'Notes de version'))
        ],
        assets: files({ name: 'product', alt: 'Violet light', title: 'Tally' }),
        forms: [contactForm()],
        pages: [
            homePage({
                title: t('Time tracking a team actually fills in', 'Le suivi du temps qu’une équipe remplit vraiment'),
                text: [
                    'One click to start, one to stop. Reports your clients understand.',
                    'Un clic pour commencer, un pour arrêter. Des rapports que vos clients comprennent.'
                ],
                image: 'product',
                link: ['pricing', t('See the plans', 'Voir les forfaits')],
                body: [
                    'Features, plans and questions are content: the pricing page follows the plans you write in the Studio.',
                    'Les fonctions, forfaits et questions sont du contenu : la page des tarifs suit les forfaits écrits dans le Studio.'
                ],
                description: t(
                    'Time tracking a team actually fills in.',
                    'Le suivi du temps qu’une équipe remplit vraiment.'
                )
            }),
            indexPage(
                'features',
                'Features',
                ['features', 'fonctions'],
                t('Features', 'Fonctions'),
                t('Everything Tally does.', 'Tout ce que fait Tally.')
            ),
            indexPage(
                'pricing',
                'Pricing',
                ['pricing', 'tarifs'],
                t('Pricing', 'Tarifs'),
                t('One price per person, no surprises.', 'Un prix par personne, sans surprise.')
            ),
            indexPage(
                'faq',
                'Questions',
                ['questions', 'questions'],
                t('Questions', 'Questions'),
                t('Before you start.', 'Avant de commencer.')
            ),
            indexPage(
                'changelog',
                'Release notes',
                ['changelog', 'nouveautes'],
                t('Release notes', 'Notes de version'),
                t('What changed, and when.', 'Ce qui a changé, et quand.')
            ),
            page('contact', 'Contact', 'contact', 'contact', {
                title: t('Talk to us', 'Parlez-nous'),
                lede: t(
                    'Questions about a plan, or a demo for your team.',
                    'Une question sur un forfait, ou une démo pour votre équipe.'
                ),
                blocks: [{ type: 'form', data: { form: 'contact' } }]
            })
        ],
        entries: {
            feature: [
                {
                    id: 'timer',
                    published: true,
                    data: {
                        name: t('One-click timer', 'Minuterie en un clic'),
                        summary: t(
                            'Start from anywhere, stop when you are done.',
                            'Démarrez de partout, arrêtez quand c’est fini.'
                        ),
                        icon: 'clock',
                        order: 1
                    }
                },
                {
                    id: 'reports',
                    published: true,
                    data: {
                        name: t('Clear reports', 'Rapports clairs'),
                        summary: t(
                            'By client, project or person, ready to send.',
                            'Par client, projet ou personne, prêts à envoyer.'
                        ),
                        icon: 'chart',
                        order: 2
                    }
                },
                {
                    id: 'invoices',
                    published: true,
                    data: {
                        name: t('Invoices', 'Factures'),
                        summary: t(
                            'Hours become an invoice in a minute.',
                            'Les heures deviennent une facture en une minute.'
                        ),
                        icon: 'file',
                        order: 3
                    }
                }
            ],
            plan: [
                {
                    id: 'solo',
                    published: true,
                    data: {
                        name: t('Solo', 'Solo'),
                        price: 0,
                        summary: t('For one person.', 'Pour une personne.'),
                        includes: [
                            t('Unlimited timers', 'Minuteries illimitées'),
                            t('Monthly reports', 'Rapports mensuels')
                        ],
                        order: 1,
                        link: {
                            pageId: { $ref: 'page:contact' },
                            label: t('Start free', 'Commencer gratuitement')
                        }
                    }
                },
                {
                    id: 'team',
                    published: true,
                    data: {
                        name: t('Team', 'Équipe'),
                        price: 8,
                        summary: t('Per person, for teams of any size.', 'Par personne, pour toute taille d’équipe.'),
                        includes: [
                            t('Everything in Solo', 'Tout Solo'),
                            t('Invoices', 'Factures'),
                            t('Shared projects', 'Projets partagés')
                        ],
                        highlighted: true,
                        order: 2,
                        link: {
                            pageId: { $ref: 'page:contact' },
                            label: t('Try for 30 days', 'Essayer 30 jours')
                        }
                    }
                }
            ],
            testimonial: [
                {
                    id: 'agency',
                    published: true,
                    data: {
                        quote: t(
                            'The first time tracker our designers did not fight.',
                            'Le premier outil de suivi que nos designers n’ont pas combattu.'
                        ),
                        name: 'Nadia Roy',
                        company: 'Atelier Roy'
                    }
                }
            ],
            question: [
                question('trial', 1, t('Is there a free trial?', 'Y a-t-il un essai gratuit ?'), [
                    'Yes: 30 days of the Team plan, no card needed.',
                    'Oui : 30 jours du forfait Équipe, sans carte.'
                ]),
                question('cancel', 2, t('Can I cancel any time?', 'Puis-je annuler à tout moment ?'), [
                    'Yes, from your account, and you keep your data.',
                    'Oui, depuis votre compte, et vous gardez vos données.'
                ])
            ],
            release: [
                {
                    id: 'v1-2',
                    published: true,
                    data: {
                        version: '1.2',
                        date: '2026-10-20',
                        body: paragraphs(
                            ['Invoices now carry your logo.'],
                            ['Les factures portent maintenant votre logo.']
                        )
                    }
                },
                {
                    id: 'v1-1',
                    published: true,
                    data: {
                        version: '1.1',
                        date: '2026-09-15',
                        body: paragraphs(['Reports by person.'], ['Rapports par personne.'])
                    }
                }
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['features', t('Features', 'Fonctions')],
                ['pricing', t('Pricing', 'Tarifs')],
                ['faq', t('Questions', 'Questions')],
                ['contact', t('Contact', 'Contact')]
            ])
        ]
    })
};
