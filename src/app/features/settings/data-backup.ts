export const BACKUP_SCHEMA_VERSION = 1 as const;

export interface DataBackup {
  timestamp: string;
  version: typeof BACKUP_SCHEMA_VERSION;
  data: Record<string, unknown>;
}

export type BackupValueValidator = (value: unknown) => boolean;
export type BackupValueValidators = Readonly<Record<string, BackupValueValidator>>;

export function createDataBackup(
  data: Record<string, unknown>,
  timestamp: string,
): DataBackup {
  return {
    timestamp,
    version: BACKUP_SCHEMA_VERSION,
    data,
  };
}

export function parseDataBackup(
  raw: string,
  allowedKeys: readonly string[],
  validators: BackupValueValidators = {},
): DataBackup {
  const parsed: unknown = JSON.parse(raw);

  if (!isObject(parsed)) {
    throw new Error("Некорректная структура резервной копии");
  }

  if (parsed.version !== BACKUP_SCHEMA_VERSION) {
    throw new Error("Неподдерживаемая версия резервной копии");
  }

  if (typeof parsed.timestamp !== "string") {
    throw new Error("Некорректная дата резервной копии");
  }

  if (!isObject(parsed.data)) {
    throw new Error("Некорректная структура резервной копии");
  }

  const allowed = new Set(allowedKeys);
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!allowed.has(key)) continue;
    const validator = validators[key];
    if (validator && !validator(value)) {
      throw new Error(`Некорректные данные резервной копии: ${key}`);
    }
    data[key] = value;
  }

  return {
    timestamp: parsed.timestamp,
    version: BACKUP_SCHEMA_VERSION,
    data,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
