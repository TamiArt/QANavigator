export type SqlDialect = "postgres" | "mysql";
export function adaptSqlForSqlite(sql: string, dialect?: SqlDialect): string;
export function registerSqlCompatibilityFunctions(database: {
  create_function(name: string, callback: (...values: (string | number | null | Uint8Array)[]) => string | number | null): void;
}): void;
