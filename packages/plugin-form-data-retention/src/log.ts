import { getProjectJson, putProjectJson } from '@moteurio/core/host.js';
import { LOG_KEY } from './policy.js';

/**
 * What the plugin did, newest first: proof that a policy runs and that a person's request was
 * met. It never holds what a visitor wrote, nor who they are: a request is kept by `reference`,
 * signed with a key the log doesn't hold, which only the same email or phone gives again.
 */
export type LogEntry =
    | {
          at: string;
          kind: 'sweep';
          forms: Record<string, { deleted: number; anonymised: number; addressesForgotten: number }>;
      }
    | {
          at: string;
          kind: 'erase' | 'export';
          reference: string;
          submissions: number;
          by: string;
      }
    | { at: string; kind: 'policy'; by: string };

/** A log a year of hourly sweeps can't outgrow. */
const KEEP = 1000;

export async function readLog(projectId: string): Promise<LogEntry[]> {
    const log = await getProjectJson<{ entries: LogEntry[] }>(projectId, LOG_KEY);
    return Array.isArray(log?.entries) ? log.entries : [];
}

export async function appendLog(projectId: string, entry: LogEntry): Promise<void> {
    const entries = [entry, ...(await readLog(projectId))].slice(0, KEEP);
    await putProjectJson(projectId, LOG_KEY, { entries });
}
