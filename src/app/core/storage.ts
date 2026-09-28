export const STORAGE_SCHEMA_VERSION = 1 as const;

interface VersionedEnvelope<T> {
  version: typeof STORAGE_SCHEMA_VERSION;
  data: T;
}

function isVersionedEnvelope<T>(value: unknown): value is VersionedEnvelope<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { version?: unknown; data?: unknown };
  return candidate.version === STORAGE_SCHEMA_VERSION && "data" in candidate;
}

export function parseStoredValue<T>(raw: string | null, initial: T): T {
  if (!raw) return initial;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isVersionedEnvelope<T>(parsed)) return parsed.data;
    return parsed as T;
  } catch {
    return initial;
  }
}

export function serializeStoredValue<T>(value: T): string {
  const envelope: VersionedEnvelope<T> = { version: STORAGE_SCHEMA_VERSION, data: value };
  return JSON.stringify(envelope);
}