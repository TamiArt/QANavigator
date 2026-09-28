export const STORAGE_SCHEMA_VERSION = 1 as const;

interface VersionedEnvelope<T> {
  version: typeof STORAGE_SCHEMA_VERSION;
  data: T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isVersionedEnvelope<T>(value: unknown): value is VersionedEnvelope<T> {
  if (!isObject(value)) return false;
  return value.version === STORAGE_SCHEMA_VERSION && "data" in value;
}

function isUnsupportedVersionedEnvelope(value: unknown): boolean {
  if (!isObject(value)) return false;
  return "version" in value && "data" in value && value.version !== STORAGE_SCHEMA_VERSION;
}

export function parseStoredValue<T>(raw: string | null, initial: T): T {
  if (!raw) return initial;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isVersionedEnvelope<T>(parsed)) return parsed.data;
    if (isUnsupportedVersionedEnvelope(parsed)) return initial;
    return parsed as T;
  } catch {
    return initial;
  }
}

export function serializeStoredValue<T>(value: T): string {
  const envelope: VersionedEnvelope<T> = { version: STORAGE_SCHEMA_VERSION, data: value };
  return JSON.stringify(envelope);
}