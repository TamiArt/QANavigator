declare module "sql.js" {
  export type SqlValue = string | number | null | Uint8Array;
  export interface QueryExecResult {
    columns: string[];
    values: SqlValue[][];
  }
  export interface Statement {
    bind(values?: unknown[] | Record<string, unknown>): boolean;
    step(): boolean;
    get(): SqlValue[];
    free(): void;
  }
  export interface Database {
    exec(sql: string): QueryExecResult[];
    run(sql: string): Database;
    prepare(sql: string): Statement;
    getRowsModified(): number;
    close(): void;
  }
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}

declare module "*.wasm?url" {
  const url: string;
  export default url;
}
