export type AdvancedSelectConfig = { table: string; selectItems: string; joins?: string; whereClause?: string; groupBy?: string; having?: string; orderBy?: string; distinct?: boolean; limit?: string; offset?: string };
export function buildAdvancedSelect(config: AdvancedSelectConfig): { sql: string; joinCount: number; groupCount: number; havingCount: number; orderCount: number };
