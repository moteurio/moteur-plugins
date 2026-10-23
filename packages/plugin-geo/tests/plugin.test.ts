import { describe, it, expect } from 'vitest';
import { manifest, init } from '../src/index.js';
import type { PluginInitContext as PluginContext } from '@moteurio/plugin-sdk';
import { geoFieldSchemas } from '../src/fields/geo/index.js';
import { mapBlockSchema } from '../src/data/blocks/geo-map.js';

describe('@moteurio/plugin-geo', () => {
    it('exports expected manifest', () => {
        expect(manifest.id).toBe('geo');
        expect(manifest.kind).toBe('optional');
    });

    it('init registers all field types and the map block', () => {
        const registered: string[] = [];
        const ctx = {
            registerFieldSchema: (schema: { type: string }) => {
                registered.push(`field:${schema.type}`);
            },
            registerBlockSchema: (schema: { type: string }) => {
                registered.push(`block:${schema.type}`);
            }
        } as unknown as PluginContext;

        init(ctx);

        expect(registered).toContain('field:geo/location');
        expect(registered).toContain('field:geo/polyline');
        expect(registered).toContain('field:geo/area');
        expect(registered).toContain('block:geo/map');
    });

    it('exports distinct field types', () => {
        const types = geoFieldSchemas.map((f) => f.type);
        expect(types).toEqual(['geo/location', 'geo/polyline', 'geo/area']);
    });

    it('exports map block type', () => {
        expect(mapBlockSchema.type).toBe('geo/map');
    });
});
