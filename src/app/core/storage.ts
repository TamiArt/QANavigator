export const STORAGE_SCHEMA_VERSION = 1 as const;

interface VersionedEnvelope<T> {
  version: typeof STORAGE_SCHEMA_VERSION;
  data: T;
}

export type StoredValueValidator = (value: unknown) => boolean;

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

export function parseStoredValue<T>(
  raw: string | null,
  initial: T,
  validate?: StoredValueValidator,
): T {
  if (!raw) return initial;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isUnsupportedVersionedEnvelope(parsed)) return initial;

    const value = isVersionedEnvelope<T>(parsed) ? parsed.data : parsed;

    return !validate || validate(value) ? (value as T) : initial;
  } catch {
    return initial;
  }
}

export function serializeStoredValue<T>(value: T): string {
  const envelope: VersionedEnvelope<T> = { version: STORAGE_SCHEMA_VERSION, data: value };
  return JSON.stringify(envelope);
}