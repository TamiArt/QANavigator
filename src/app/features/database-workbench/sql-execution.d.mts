export type SqlResultValue = string | number | null | Uint8Array;
export type SqlResultTable = {
  columns: string[];
  rows: SqlResultValue[][];
  rowCount: number;
  truncated: boolean;
};
export type SqlStatementResult = {
  index: number;
  sql: string;
  tables: SqlResultTable[];
  affectedRows: number | null;
  ok: true;
};
export type SqlBatchResult = {
  ok: boolean;
  statementCount: number;
  completedCount?: number;
  results: SqlStatementResult[];
  error: string | null;
  failedStatement?: number;
  failedSql?: string;
};
export function splitSqlStatements(sql: string): string[];
export function executeSqlBatch(database: {
  exec(sql: string): { columns: string[]; values: SqlResultValue[][] }[];
  getRowsModified(): number;
}, sql: string, dialect?: "postgres" | "mysql"): SqlBatchResult;
export const SQL_EXECUTION_LIMITS: Readonly<{ maxStatements: number; maxRowsPerResult: number }>;
