import type { BlockSchema } from '@moteurio/types/Block.js';
import { mapBlockSchema } from './geo-map.js';

/** All block schemas registered by the geo plugin. */
export const geoBlockSchemas: BlockSchema[] = [mapBlockSchema];

export { mapBlockSchema };
