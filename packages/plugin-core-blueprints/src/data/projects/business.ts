/** Business: services, team, offices, testimonials and questions, for a firm or a practice. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import {
    base,
    bundle,
    collectionPage,
    contactForm,
    files,
    homePage,
    hoursField,
    indexPage,
    indexTemplate,
    menu,
    paragraphs,
    pic,
    picture,
    question,
    questionModel,
    relations,
    rich,
    seoField,
    slug,
    t,
    text,
    textarea
} from './base.js';

const shared = base({
    siteName: 'Lavoie & Partners',
    tagline: t('Advice for small companies, since 1998.', 'Des conseils aux petites entreprises, depuis 1998.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    words: {
        hours: [t('“Opening hours” heading', 'Titre « Heures d’ouverture »'), t('Opening hours', 'Heures d’ouverture')],
        closed: [t('Closed', 'Fermé'), t('Closed', 'Fermé')],
        whoWorksOnIt: [
            t('“Who works on it” heading', 'Titre « Qui s’en occupe »'),
            t('Who works on it', 'Qui s’en occupe')
        ]
    }
});

const models = [
    {
        id: 'service',
        label: t('Service', 'Service'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            slug: slug(),
            summary: textarea(t('Summary', 'Résumé'), { maxLength: 240 }),
            body: rich(t('Text', 'Texte')),
            people: relations(t('Who works on it', 'Qui s’en occupe'), 'person'),
            order: { type: 'core/number', label: t('Order', 'Ordre') },
            seo: seoField()
        }
    },
    {
        id: 'person',
        label: t('Person', 'Personne'),
        fields: {
            name: {
                type: 'core/text',
                label: t('Name', 'Nom'),
                options: { required: true }
            },
            role: text(t('Role', 'Rôle')),
            photo: picture(t('Photo', 'Photo')),
            bio: textarea(t('Bio', 'Biographie')),
            email: { type: 'core/email', label: t('Email', 'Courriel') }
        }
    },
    {
        id: 'office',
        label: t('Office', 'Bureau'),
        fields: {
            name: text(t('Name', 'Nom'), { required: true }),
            address: { type: 'core/address', label: t('Address', 'Adresse') },
            phone: { type: 'core/phone', label: t('Phone', 'Téléphone') },
            email: { type: 'core/email', label: t('Email', 'Courriel') },
            hours: hoursField()
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
    questionModel()
] as ModelSchema[];

const weekdays = (en: string, fr: string) => ({
    monday: t(en, fr),
    tuesday: t(en, fr),
    wednesday: t(en, fr),
    thursday: t(en, fr),
    friday: t(en, fr)
});

export const businessBlueprint: BlueprintSchema = {
    id: 'business',
    name: 'Business',
    description: 'Services, team, offices, testimonials and questions, for a firm, a practice or a studio.',
    kind: 'project',
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [
            indexTemplate('services', t('Services', 'Services')),
            indexTemplate('team', t('Team', 'Équipe')),
            indexTemplate('contact', t('Contact', 'Contact')),
            indexTemplate('faq', t('Questions', 'Questions'))
        ],
        assets: files(
            { name: 'business', alt: 'Calm blue light', title: 'Lavoie & Partners' },
            { name: 'person-1', alt: 'Portrait', title: 'Portrait' },
            { name: 'person-2', alt: 'Portrait', title: 'Portrait' }
        ),
        forms: [contactForm()],
        pages: [
            homePage({
                title: t('Advice that fits your company', 'Des conseils à la mesure de votre entreprise'),
                text: [
                    'Accounting, payroll and planning for companies of 2 to 50 people.',
                    'Comptabilité, paie et planification pour les entreprises de 2 à 50 personnes.'
                ],
                image: 'business',
                link: ['services', t('Our services', 'Nos services')],
                body: [
                    'Services, team and offices are content: change them in the Studio, the site follows.',
                    'Les services, l’équipe et les bureaux sont du contenu : changez-les dans le Studio, le site suit.'
                ],
                description: t(
                    'Advice for small companies, since 1998.',
                    'Des conseils aux petites entreprises, depuis 1998.'
                )
            }),
            collectionPage(
                'services',
                'Services',
                ['services', 'services'],
                'service',
                t('Services', 'Services'),
                t('What we do, and who does it.', 'Ce que nous faisons, et qui le fait.')
            ),
            indexPage(
                'team',
                'Team',
                ['team', 'equipe'],
                t('Our team', 'Notre équipe'),
                t('The people you will work with.', 'Les personnes avec qui vous travaillerez.')
            ),
            indexPage(
                'faq',
                'Questions',
                ['questions', 'questions'],
                t('Questions', 'Questions'),
                t('What clients ask us most.', 'Ce que nos clients nous demandent le plus.')
            ),
            indexPage(
                'contact',
                'Contact',
                ['contact', 'contact'],
                t('Contact', 'Contact'),
                t('Come by, call or write.', 'Passez, appelez ou écrivez.')
            )
        ],
        entries: {
            person: [
                {
                    id: 'claire',
                    published: true,
                    data: {
                        name: 'Claire Lavoie',
                        role: t('Founding partner', 'Associée fondatrice'),
                        photo: pic('person-1'),
                        bio: t('Thirty years with small companies.', 'Trente ans auprès des petites entreprises.'),
                        email: 'claire@example.com'
                    }
                },
                {
                    id: 'samir',
                    published: true,
                    data: {
                        name: 'Samir Haddad',
                        role: t('Payroll lead', 'Responsable de la paie'),
                        photo: pic('person-2'),
                        bio: t('Keeps payroll simple and on time.', 'Garde la paie simple et à l’heure.'),
                        email: 'samir@example.com'
                    }
                }
            ],
            service: [
                {
                    id: 'accounting',
                    published: true,
                    data: {
                        name: t('Accounting', 'Comptabilité'),
                        slug: t('accounting', 'comptabilite'),
                        summary: t(
                            'Books kept, monthly reports, year-end statements.',
                            'Tenue de livres, rapports mensuels, états de fin d’année.'
                        ),
                        body: paragraphs(
                            ['Describe the service: what it includes, how it works, what it costs.'],
                            ['Décrivez le service : ce qu’il comprend, comment il se passe, ce qu’il coûte.']
                        ),
                        people: [{ $ref: 'entry:person/claire' }],
                        order: 1
                    }
                },
                {
                    id: 'payroll',
                    published: true,
                    data: {
                        name: t('Payroll', 'Paie'),
                        slug: t('payroll', 'paie'),
                        summary: t(
                            'Pay, deductions and remittances, every two weeks.',
                            'Paies, retenues et remises, toutes les deux semaines.'
                        ),
                        body: paragraphs(['Describe the service.'], ['Décrivez le service.']),
                        people: [{ $ref: 'entry:person/samir' }],
                        order: 2
                    }
                },
                {
                    id: 'planning',
                    published: true,
                    data: {
                        name: t('Planning', 'Planification'),
                        slug: t('planning', 'planification'),
                        summary: t(
                            'Budgets and forecasts you can act on.',
                            'Des budgets et prévisions utiles pour décider.'
                        ),
                        body: paragraphs(['Describe the service.'], ['Décrivez le service.']),
                        people: [{ $ref: 'entry:person/claire' }, { $ref: 'entry:person/samir' }],
                        order: 3
                    }
                }
            ],
            office: [
                {
                    id: 'main',
                    published: true,
                    data: {
                        name: t('Main office', 'Bureau principal'),
                        address: {
                            street: '100 Main Street',
                            city: 'Montréal',
                            state: 'QC',
                            country: 'CA',
                            postalCode: 'H2X 1Y4'
                        },
                        phone: '+1 514 555 0100',
                        email: 'hello@example.com',
                        hours: weekdays('9:00 to 17:00', '9 h à 17 h')
                    }
                }
            ],
            testimonial: [
                {
                    id: 'bakery',
                    published: true,
                    data: {
                        quote: t(
                            'They took payroll off our hands, and never missed a date.',
                            'Ils nous ont libérés de la paie, sans jamais manquer une date.'
                        ),
                        name: 'Marie Côté',
                        company: 'Boulangerie Côté'
                    }
                },
                {
                    id: 'studio',
                    published: true,
                    data: {
                        quote: t('Our first clear budget in ten years.', 'Notre premier budget clair en dix ans.'),
                        name: 'Tom Wu',
                        company: 'Wu Design'
                    }
                }
            ],
            question: [
                question('fees', 1, t('How do you charge?', 'Comment facturez-vous ?'), [
                    'A fixed monthly fee, agreed in advance.',
                    'Un forfait mensuel, convenu d’avance.'
                ]),
                question('start', 2, t('How do we start?', 'Comment commence-t-on ?'), [
                    'With a free first meeting, at our office or yours.',
                    'Par une première rencontre gratuite, chez nous ou chez vous.'
                ]),
                question('switch', 3, t('Can we switch from another firm?', 'Peut-on quitter un autre cabinet ?'), [
                    'Yes: we take your files over and handle the transition.',
                    'Oui : nous reprenons vos dossiers et gérons la transition.'
                ])
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['services', t('Services', 'Services')],
                ['team', t('Team', 'Équipe')],
                ['faq', t('Questions', 'Questions')],
                ['contact', t('Contact', 'Contact')]
            ])
        ]
    })
};
