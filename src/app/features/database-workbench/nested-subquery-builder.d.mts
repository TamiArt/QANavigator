export type NestedSubqueryLevel = {
  id: number;
  table: string;
  selectKind: "aggregate" | "column";
  aggregate: "AVG" | "SUM" | "MIN" | "MAX";
  column: string;
  filterEnabled: boolean;
  filterColumn: string;
  filterOperator: "=" | "<>" | ">" | ">=" | "<" | "<=";
  filterValue: string;
};

export function buildNestedScalarSubquery(
  levels: NestedSubqueryLevel[],
  quoteIdentifier: (identifier: string) => string,
  toSqlValue: (value: string) => string,
): string;

export type CorrelatedExistsLevel = {
  id?: number;
  table: string;
  alias: string;
  innerColumn: string;
  outerDepth: number;
  outerColumn: string;
  filterEnabled?: boolean;
  filterColumn?: string;
  filterOperator?: "=" | "<>" | ">" | ">=" | "<" | "<=" | "LIKE";
  filterValue?: string;
};
export function buildCorrelatedExistsSubquery(
  config: { mode?: "EXISTS" | "NOT EXISTS"; outer: { table: string; alias: string }; levels: CorrelatedExistsLevel[] },
  quoteIdentifier: (identifier: string) => string,
  toSqlValue: (value: string) => string,
): string;
