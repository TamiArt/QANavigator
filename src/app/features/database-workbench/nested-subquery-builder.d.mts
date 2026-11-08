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
