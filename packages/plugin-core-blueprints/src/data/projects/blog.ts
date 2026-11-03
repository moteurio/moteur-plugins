/** Blog: posts with authors and categories, for a person, a team or a company's journal. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import {
    base,
    bundle,
    collectionPage,
    contactForm,
    files,
    homePage,
    indexTemplate,
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
    siteName: 'Field Notes',
    tagline: t('Notes from the field, every other week.', 'Des notes du terrain, une semaine sur deux.'),
    footer: t('Written in Moteur.', 'Écrit dans Moteur.'),
    words: {
        by: [t('“By” before an author', '« Par » avant un auteur'), t('By', 'Par')],
        backToBlog: [t('Link back to the blog', 'Lien de retour au blogue'), t('Back to the blog', 'Retour au blogue')]
    }
});

const models = [
    {
        id: 'post',
        label: t('Post', 'Article'),
        fields: {
            title: text(t('Title', 'Titre'), { required: true }),
            slug: slug(),
            date: {
                type: 'core/date',
                label: t('Date', 'Date'),
                options: { required: true }
            },
            excerpt: textarea(t('Summary', 'Résumé'), { maxLength: 300 }),
            cover: picture(t('Cover', 'Couverture')),
            body: rich(t('Text', 'Texte')),
            author: relation(t('Author', 'Auteur'), 'author'),
            categories: relations(t('Categories', 'Catégories'), 'category'),
            seo: seoField()
        }
    },
    {
        id: 'author',
        label: t('Author', 'Auteur'),
        fields: {
            name: {
                type: 'core/text',
                label: t('Name', 'Nom'),
                options: { required: true }
            },
            bio: textarea(t('Bio', 'Biographie')),
            photo: picture(t('Photo', 'Photo'))
        }
    },
    {
        id: 'category',
        label: t('Category', 'Catégorie'),
        fields: { name: text(t('Name', 'Nom'), { required: true }) }
    }
] as ModelSchema[];

export const blogBlueprint: BlueprintSchema = {
    id: 'blog',
    name: 'Blog',
    description: 'Posts with authors and categories, and pages around them.',
    kind: 'project',
    firstProject: true,
    languages: ['en', 'fr'],
    bundle: bundle(shared, {
        models,
        templates: [indexTemplate('blog', t('Blog', 'Blogue'))],
        assets: files(
            {
                name: 'blog',
                alt: 'Warm light over still water',
                title: 'Field Notes'
            },
            { name: 'person-1', alt: 'Portrait', title: 'Portrait' },
            { name: 'person-2', alt: 'Portrait', title: 'Portrait' }
        ),
        forms: [contactForm()],
        pages: [
            homePage({
                title: t('Notes from the field', 'Des notes du terrain'),
                text: [
                    'A blog in two languages: posts, authors and categories.',
                    'Un blogue en deux langues : articles, auteurs et catégories.'
                ],
                image: 'blog',
                link: ['blog', t('Read the blog', 'Lire le blogue')],
                body: [
                    'Posts are entries: the blog page gives each one its address, in each language it is written in.',
                    'Les articles sont des entrées : la page du blogue donne à chacun son adresse, dans chaque langue où il est écrit.'
                ],
                description: t('Notes from the field, every other week.', 'Des notes du terrain, une semaine sur deux.')
            }),
            collectionPage(
                'blog',
                'Blog',
                ['blog', 'blogue'],
                'post',
                t('Blog', 'Blogue'),
                t('The latest posts first.', 'Les plus récents d’abord.')
            ),
            page('about', 'About', 'about', 'a-propos', {
                title: t('About', 'À propos'),
                lede: t('Who writes here.', 'Qui écrit ici.'),
                blocks: [
                    {
                        type: 'text',
                        data: {
                            body: paragraphs(
                                ['Say who you are and what you write about.'],
                                ['Dites qui vous êtes et de quoi vous écrivez.']
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
            author: [
                {
                    id: 'ada',
                    published: true,
                    data: {
                        name: 'Ada Martin',
                        bio: t(
                            'Writes about tools and the people who make them.',
                            'Écrit sur les outils et ceux qui les font.'
                        ),
                        photo: pic('person-1')
                    }
                },
                {
                    id: 'leo',
                    published: true,
                    data: {
                        name: 'Léo Tremblay',
                        bio: t('Edits, and writes the long reads.', 'Édite, et écrit les textes longs.'),
                        photo: pic('person-2')
                    }
                }
            ],
            category: [
                { id: 'news', published: true, data: { name: t('News', 'Nouvelles') } },
                {
                    id: 'guides',
                    published: true,
                    data: { name: t('Guides', 'Guides') }
                }
            ],
            post: [
                {
                    id: 'welcome',
                    published: true,
                    data: {
                        title: t('Welcome', 'Bienvenue'),
                        slug: t('welcome', 'bienvenue'),
                        date: '2026-11-02',
                        excerpt: t('The first post, in two languages.', 'Le premier article, en deux langues.'),
                        cover: pic('blog'),
                        body: {
                            html: {
                                en: '<p>Posts have an author and categories. A link to <a href="/about">the about page</a> follows the page in every language.</p>',
                                fr: '<p>Les articles ont un auteur et des catégories. Un lien vers <a href="/fr/a-propos">la page À propos</a> suit la page dans chaque langue.</p>'
                            }
                        },
                        author: { $ref: 'entry:author/ada' },
                        categories: [{ $ref: 'entry:category/news' }]
                    }
                },
                {
                    id: 'writing-in-two-languages',
                    published: true,
                    data: {
                        title: t('Writing in two languages', 'Écrire en deux langues'),
                        slug: t('writing-in-two-languages', 'ecrire-en-deux-langues'),
                        date: '2026-10-26',
                        excerpt: t(
                            'Each post has its own address in each language.',
                            'Chaque article a son adresse dans chaque langue.'
                        ),
                        body: {
                            html: {
                                en: '<p>Write the English first, then the French beside it in the Studio.</p>',
                                fr: '<p>Écrivez l’anglais d’abord, puis le français à côté dans le Studio.</p>'
                            }
                        },
                        author: { $ref: 'entry:author/leo' },
                        categories: [{ $ref: 'entry:category/guides' }]
                    }
                },
                {
                    id: 'only-in-english',
                    published: true,
                    languages: ['en'],
                    data: {
                        title: t('Only in English', 'Only in English'),
                        slug: t('only-in-english', 'only-in-english'),
                        date: '2026-10-19',
                        excerpt: t(
                            'A post that isn’t translated has no French address.',
                            'A post that isn’t translated has no French address.'
                        ),
                        body: {
                            html: {
                                en: '<p>Its languages say English only: the French blog leaves it out.</p>',
                                fr: '<p>Its languages say English only: the French blog leaves it out.</p>'
                            }
                        },
                        author: { $ref: 'entry:author/ada' },
                        categories: [{ $ref: 'entry:category/guides' }]
                    }
                }
            ]
        },
        menus: [
            menu('main', 'Main', [
                ['blog', t('Blog', 'Blogue')],
                ['about', t('About', 'À propos')]
            ])
        ]
    })
};
