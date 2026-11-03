/** The project blueprints: what a new project can start with, for an agency's usual projects. */
import type { BlueprintSchema } from '@moteurio/types/Blueprint.js';
import { siteBlueprint } from './site.js';
import { businessBlueprint } from './business.js';
import { blogBlueprint } from './blog.js';
import { productBlueprint } from './product.js';
import { portfolioBlueprint } from './portfolio.js';
import { restaurantBlueprint } from './restaurant.js';
import { eventsBlueprint } from './events.js';
import { catalogBlueprint } from './catalog.js';

export const projectBlueprints: BlueprintSchema[] = [
    siteBlueprint,
    businessBlueprint,
    productBlueprint,
    blogBlueprint,
    portfolioBlueprint,
    restaurantBlueprint,
    eventsBlueprint,
    catalogBlueprint,
    {
        id: 'empty',
        name: 'Empty project',
        description: 'Nothing yet: models, templates and pages are yours to make.',
        kind: 'project'
    }
];
