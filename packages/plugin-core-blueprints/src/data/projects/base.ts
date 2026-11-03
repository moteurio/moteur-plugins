/**
 * What every project blueprint starts with: a page builder (hero, text, picture and form
 * blocks), the home and page templates, search engine fields, and the site's settings with the
 * interface's own words. Each blueprint adds its models, templates and first content.
 * Content is in English and French.
 */
import fs from 'node:fs';
import type { ImportBundle } from '@moteurio/types/Import.js';
import type { Field } from '@moteurio/types/Field.js';
import type { BlockSchema } from '@moteurio/types/Block.js';
import type { ModelSchema } from '@moteurio/types/Model.js';
import type { StructureSchema } from '@moteurio/types/Structure.js';

export type Words = { en: string; fr: string };
export const t = (en: string, fr: string): Words => ({ en, fr });

type FieldDef = Field;

/** One line of text, in every language. */
export const text = (label: Words, options: Record<string, unknown> = {}): FieldDef => ({
    type: 'core/text',
    label,
    options: { multilingual: true, ...options }
});
/** A few lines of plain text, in every language. */
export const textarea = (label: Words, options: Record<string, unknown> = {}): FieldDef => ({
    type: 'core/textarea',
    label,
    options: { multilingual: true, ...options }
});
/** Rich text, in every language. */
export const rich = (label: Words, options: Record<string, unknown> = {}): FieldDef => ({
    type: 'core/rich-text',
    label,
    options: { multilingual: true, ...options }
});
export const picture = (label: Words, options: Record<string, unknown> = {}): FieldDef => ({
    type: 'core/asset',
    label,
    ...(Object.keys(options).length && { options })
});
/** The address segment of an entry with its own page, in every language. */
export const slug = (): FieldDef => text(t('Address', 'Adresse'), { required: true });
export const seoField = (): FieldDef => ({
    type: 'core/structure',
    label: t('Search engines', 'Moteurs de recherche'),
    options: { structure: 'seo' }
});
export const relation = (label: Words, model: string, options: Record<string, unknown> = {}): FieldDef => ({
    type: 'core/relation',
    label,
    options: { model, ...options }
});
export const relations = (label: Words, model: string, options: Record<string, unknown> = {}): FieldDef => ({
    type: 'core/relations',
    label,
    options: { model, ...options }
});

/** A paragraph of rich text in each language. */
export const paragraphs = (en: string[], fr: string[]) => {
    const doc = (texts: string[]) => ({
        schema: 'dast',
        document: {
            type: 'root',
            children: texts.map(value => ({
                type: 'paragraph',
                children: [{ type: 'span', value }]
            }))
        }
    });
    return { dast: { en: doc(en), fr: doc(fr) } };
};

/** A picture of the blueprint's files, by name: `{ "$ref": "asset:<name>" }`. */
export const pic = (name: string, alt?: Words) => ({
    assetId: { $ref: `asset:${name}` },
    ...(alt && { alt })
});

const filesDir = new URL('../../../files/', import.meta.url);

/** The blueprint's pictures, inline, from the package's files. */
export function files(...names: { name: string; alt: string; title: string }[]): NonNullable<ImportBundle['assets']> {
    return names.map(({ name, alt, title }) => ({
        ref: name,
        name: `${name}.jpg`,
        content: fs.readFileSync(new URL(`${name}.jpg`, filesDir)).toString('base64'),
        alt,
        title
    }));
}

/** The blocks every page can stack. */
export const BLOCKS = ['hero', 'text', 'picture', 'form'];

/** The interface's words every site needs; a blueprint adds its own. */
const BASE_WORDS: Record<string, [Words, Words]> = {
    menuLabel: [t('Menu label', 'Nom du menu'), t('Main menu', 'Menu principal')],
    languagesLabel: [t('Languages label', 'Nom du choix de langue'), t('Languages', 'Langues')],
    readMore: [t('“Read more” link', 'Lien « Lire la suite »'), t('Read more', 'Lire la suite')],
    notTranslated: [
        t('Note on parts not translated', 'Note sur les parties non traduites'),
        t('Some of this page is not translated yet.', 'Une partie de cette page n’est pas encore traduite.')
    ],
    notFound: [t('Page not found', 'Page introuvable'), t('Page not found', 'Page introuvable')],
    send: [t('Form button', 'Bouton des formulaires'), t('Send', 'Envoyer')],
    sent: [
        t('Form sent', 'Formulaire envoyé'),
        t('Thank you. We will get back to you soon.', 'Merci. Nous vous répondrons bientôt.')
    ]
};

type BaseOptions = {
    siteName: string;
    tagline: Words;
    footer: Words;
    /** Words of the blueprint's own views: field id → [its label, its value]. */
    words?: Record<string, [Words, Words]>;
    /** The block types a page may stack (default: hero, text, picture, form). */
    blocks?: string[];
};

/** The shared part of a project blueprint's bundle. */
export function base(options: BaseOptions): {
    structures: StructureSchema[];
    blocks: BlockSchema[];
    models: ModelSchema[];
    templates: NonNullable<ImportBundle['templates']>;
    settings: NonNullable<ImportBundle['entries']>[string][number];
} {
    const words = { ...BASE_WORDS, ...options.words };
    const blockList = (label: Words): FieldDef => ({
        type: 'core/block-list',
        label,
        options: { allowedBlockTypes: options.blocks ?? BLOCKS }
    });
    return {
        structures: [
            {
                type: 'seo',
                label: t('Search engines', 'Moteurs de recherche'),
                fields: {
                    title: text(t('Title in search results', 'Titre dans les résultats'), {
                        maxLength: 70
                    }),
                    description: textarea(t('Description', 'Description'), {
                        maxLength: 160
                    }),
                    image: picture(t('Picture when shared', 'Image au partage'))
                }
            }
        ],
        blocks: [
            {
                type: 'hero',
                label: t('Hero', 'Bandeau'),
                description: t(
                    'The top of a page: a title, a few words, a picture and a button.',
                    'Le haut d’une page : un titre, quelques mots, une image et un bouton.'
                ),
                fields: {
                    title: text(t('Title', 'Titre'), { required: true }),
                    text: rich(t('Text', 'Texte')),
                    image: picture(t('Picture', 'Image')),
                    link: { type: 'core/link', label: t('Button', 'Bouton') }
                }
            },
            {
                type: 'text',
                label: t('Text', 'Texte'),
                fields: { body: rich(t('Text', 'Texte'), { required: true }) }
            },
            {
                type: 'picture',
                label: t('Picture', 'Image'),
                fields: {
                    image: picture(t('Picture', 'Image'), { required: true }),
                    caption: text(t('Caption', 'Légende'))
                }
            },
            {
                type: 'form',
                label: t('Form', 'Formulaire'),
                description: t(
                    'One of the project’s forms, by its id.',
                    'Un des formulaires du projet, par son identifiant.'
                ),
                fields: {
                    title: text(t('Title', 'Titre')),
                    form: {
                        type: 'core/text',
                        label: t('Form id', 'Identifiant du formulaire'),
                        options: { required: true }
                    }
                }
            }
        ],
        models: [
            {
                id: 'settings',
                label: t('Site settings', 'Réglages du site'),
                modelType: 'settings',
                fields: {
                    siteName: {
                        type: 'core/text',
                        label: t('Site name', 'Nom du site'),
                        options: { required: true }
                    },
                    tagline: text(t('Tagline', 'Accroche')),
                    footer: text(t('Footer', 'Pied de page')),
                    ...Object.fromEntries(
                        Object.entries(words).map(([id, [label]]) => [id, text(label, { required: true })])
                    )
                }
            }
        ],
        templates: [
            {
                id: 'home',
                label: t('Home', 'Accueil'),
                fields: { blocks: blockList(t('Blocks', 'Blocs')), seo: seoField() }
            },
            {
                id: 'page',
                label: t('Page', 'Page'),
                fields: {
                    title: text(t('Title', 'Titre'), { required: true }),
                    lede: text(t('Lede', 'Chapô')),
                    blocks: blockList(t('Blocks', 'Blocs')),
                    seo: seoField()
                }
            }
        ],
        settings: {
            id: 'settings',
            published: true,
            data: {
                siteName: options.siteName,
                tagline: options.tagline,
                footer: options.footer,
                ...Object.fromEntries(Object.entries(words).map(([id, [, value]]) => [id, value]))
            }
        }
    };
}

/** A contact form: name, email, message. */
export const contactForm = (id = 'contact') => ({
    id,
    label: 'Contact',
    description: 'Messages from the contact page.',
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
        message: {
            type: 'core/textarea',
            label: t('Message', 'Message'),
            options: { required: true }
        }
    }
});

/** A page with its title, a lede and blocks. */
export const page = (
    id: string,
    label: string,
    slug: string,
    slugFr: string,
    fields: Record<string, unknown>,
    extra: Record<string, unknown> = {}
) => ({
    id,
    label,
    slug,
    ...(slugFr !== slug && { slugs: { fr: slugFr } }),
    templateId: 'page',
    published: true,
    fields,
    ...extra
});

/** A page that lists something (a blog, a team, a menu): its view knows what by its template. */
export const indexTemplate = (id: string, label: Words) => ({
    id,
    label,
    fields: {
        title: text(t('Title', 'Titre'), { required: true }),
        lede: text(t('Lede', 'Chapô')),
        seo: seoField()
    }
});

/** A page made from an index template. */
export const indexPage = (
    id: string,
    label: string,
    slugs: [string, string],
    title: Words,
    lede: Words,
    extra: Record<string, unknown> = {}
) => ({
    id,
    label,
    slug: slugs[0],
    ...(slugs[1] !== slugs[0] && { slugs: { fr: slugs[1] } }),
    templateId: id,
    published: true,
    fields: { title, lede },
    ...extra
});

/** A list page whose entries have their own addresses: `/<slug>/<entry slug>`. */
export const collectionPage = (
    id: string,
    label: string,
    slugs: [string, string],
    model: string,
    title: Words,
    lede: Words
) =>
    indexPage(id, label, slugs, title, lede, {
        type: 'collection',
        modelId: model,
        urlPattern: '[slug]'
    });

/** Questions and their answers, in order. */
export const questionModel = (): ModelSchema =>
    ({
        id: 'question',
        label: t('Question', 'Question'),
        fields: {
            question: text(t('Question', 'Question'), { required: true }),
            answer: rich(t('Answer', 'Réponse'), { required: true }),
            order: { type: 'core/number', label: t('Order', 'Ordre') }
        }
    }) as ModelSchema;

export const question = (id: string, order: number, q: Words, a: [string, string]) => ({
    id,
    published: true,
    data: { question: q, answer: paragraphs([a[0]], [a[1]]), order }
});

/** Opening hours by day: a map field, its keys the days. */
export const hoursField = (): Field => ({
    type: 'core/map',
    label: t('Opening hours', 'Heures d’ouverture'),
    options: {
        keys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        value: text(t('Hours', 'Heures'))
    }
});

/** A menu of the bundle's pages, by id: [page id, its label]. */
export const menu = (handle: string, label: string, items: [string, Words][]) => ({
    handle,
    label,
    items: items.map(([id, itemLabel]) => ({
        id,
        label: itemLabel,
        linkType: 'page',
        pageId: { $ref: `page:${id}` }
    }))
});

/** The home page: a hero with a button to one of the pages, a paragraph, its description. */
export const homePage = (o: {
    title: Words;
    text: [string, string];
    image: string;
    link: [string, Words];
    body: [string, string];
    description: Words;
}) => ({
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
                    title: o.title,
                    text: paragraphs([o.text[0]], [o.text[1]]),
                    image: pic(o.image),
                    link: { pageId: { $ref: `page:${o.link[0]}` }, label: o.link[1] }
                }
            },
            { type: 'text', data: { body: paragraphs([o.body[0]], [o.body[1]]) } }
        ],
        seo: { description: o.description }
    }
});

/** A bundle from the shared base and a blueprint's own parts. */
export function bundle(
    shared: ReturnType<typeof base>,
    own: Omit<ImportBundle, 'version'> & {
        entries?: NonNullable<ImportBundle['entries']>;
    }
): ImportBundle {
    return {
        version: 1,
        structures: [...shared.structures, ...(own.structures ?? [])],
        blocks: [...shared.blocks, ...(own.blocks ?? [])],
        models: [...shared.models, ...(own.models ?? [])],
        templates: [...shared.templates, ...(own.templates ?? [])],
        ...(own.assets && { assets: own.assets }),
        ...(own.forms && { forms: own.forms }),
        pages: own.pages ?? [],
        entries: { settings: [shared.settings], ...own.entries },
        ...(own.menus && { menus: own.menus })
    };
}
