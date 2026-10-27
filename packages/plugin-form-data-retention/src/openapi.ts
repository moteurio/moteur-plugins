import type { OpenAPIV3 } from 'openapi-types';

const projectId: OpenAPIV3.ParameterObject = {
    name: 'projectId',
    in: 'path',
    required: true,
    schema: { type: 'string' }
};
const tags = ['Forms: data retention'];
const rule: OpenAPIV3.SchemaObject = {
    type: 'object',
    required: ['keepDays', 'then'],
    properties: {
        keepDays: { type: 'integer', minimum: 1, maximum: 3650 },
        then: { type: 'string', enum: ['delete', 'anonymise'] },
        keepFields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Anonymising: answers kept as they are (a topic, a rating).'
        }
    }
};
const person: OpenAPIV3.RequestBodyObject = {
    required: true,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    email: { type: 'string', description: 'Matched in any answer, ignoring case.' },
                    phone: {
                        type: 'string',
                        description: 'Its digits, 7 or more; +1 514… and (514)… match.'
                    }
                }
            }
        }
    }
};
const noPerson = { description: 'Neither a usable email nor phone (`PERSON_REQUIRED`)' };
const adminOnly = { description: 'Project admins only' };

export const openapi: Record<string, OpenAPIV3.PathItemObject> = {
    '/projects/{projectId}/retention': {
        get: {
            summary: 'The retention policy, and each form’s submissions and how many are past it',
            tags,
            parameters: [projectId],
            responses: { '200': { description: '`{ policy, forms }`' }, '403': adminOnly }
        },
        put: {
            summary: 'Set the retention policy',
            description:
                'A `default` rule for every form, `forms` by id (null: kept until someone deletes them), and `forgetAddressesAfterDays` (visitors’ IP and browser). Applied hourly, or now with …/run.',
            tags,
            parameters: [projectId],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                default: rule,
                                forms: {
                                    type: 'object',
                                    additionalProperties: { ...rule, nullable: true }
                                },
                                forgetAddressesAfterDays: { type: 'integer', minimum: 0 }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': { description: '`{ policy }`' },
                '403': adminOnly,
                '422': { description: 'The policy doesn’t fit (`RETENTION_POLICY_INVALID`)' }
            }
        }
    },
    '/projects/{projectId}/retention/run': {
        post: {
            summary: 'Apply the policy now',
            tags,
            parameters: [
                projectId,
                {
                    name: 'dryRun',
                    in: 'query',
                    schema: { type: 'boolean' },
                    description: 'Count what would change, change nothing.'
                }
            ],
            responses: {
                '200': { description: '`{ at, dryRun, forms: { [formId]: { deleted, anonymised, addressesForgotten } } }`' },
                '403': adminOnly
            }
        }
    },
    '/projects/{projectId}/retention/log': {
        get: {
            summary: 'What the policy and people’s requests changed, newest first',
            description: 'Never what visitors wrote, nor who asked: a request is kept by its `reference`.',
            tags,
            parameters: [projectId, { name: 'limit', in: 'query', schema: { type: 'integer' } }],
            responses: { '200': { description: '`{ entries }`' }, '403': adminOnly }
        }
    },
    '/projects/{projectId}/retention/people/find': {
        post: {
            summary: 'Which submissions a person sent',
            tags,
            parameters: [projectId],
            requestBody: person,
            responses: { '200': { description: '`{ submissions }`' }, '400': noPerson, '403': adminOnly }
        }
    },
    '/projects/{projectId}/retention/people/export': {
        post: {
            summary: 'A copy of everything a person sent (right of access)',
            tags,
            parameters: [projectId],
            requestBody: person,
            responses: {
                '200': { description: '`{ reference, generatedAt, submissions }`, to send them' },
                '400': noPerson,
                '403': adminOnly
            }
        }
    },
    '/projects/{projectId}/retention/people/erase': {
        post: {
            summary: 'Delete everything a person sent, for good (right to erasure)',
            tags,
            parameters: [projectId],
            requestBody: person,
            responses: {
                '200': { description: 'A receipt: `{ reference, erasedAt, erased, forms }`' },
                '400': noPerson,
                '403': adminOnly
            }
        }
    }
};
