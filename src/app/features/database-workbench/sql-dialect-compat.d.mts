export type SqlDialect = "postgres" | "mysql";
export function adaptSqlForSqlite(sql: string, dialect?: SqlDialect): string;
export function registerSqlCompatibilityFunctions(database: unknown): void;
