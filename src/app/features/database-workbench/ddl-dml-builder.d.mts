export type SqlDialect = "postgres" | "mysql";
export function buildCreateTable(config: { dialect?: SqlDialect; table: string; columns: string }): { sql: string; columnCount: number };
export function buildAlterTable(config: { dialect?: SqlDialect; table: string; action: "add" | "drop" | "rename" | "type"; column: string; definition?: string; dataType?: string; typeSize?: string; newName?: string }): { sql: string };
export function buildDropTable(config: { dialect?: SqlDialect; table: string; confirmName: string; ifExists?: boolean }): { sql: string };
export function buildTruncateTable(config: { dialect?: SqlDialect; table: string; confirmName: string }): { sql: string };
export function buildInsert(config: { dialect?: SqlDialect; table: string; columns: string; rows?: string; selectSql?: string }): { sql: string; rowCount?: number };
export function buildUpdate(config: { dialect?: SqlDialect; table: string; assignments: string; where: string }): { sql: string };
export function buildDelete(config: { dialect?: SqlDialect; table: string; where: string }): { sql: string };
