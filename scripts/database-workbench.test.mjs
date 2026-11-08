import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile("src/app/features/database-workbench/DatabaseWorkbenchModule.tsx", "utf8");

test("database workbench exposes practical SQL operations", () => {
  for (const operation of ["SELECT", "JOIN", "INSERT", "UPDATE", "DELETE", "RENAME", "AS"]) {
    assert.ok(source.includes(operation), "workbench is missing " + operation);
  }
});

test("database workbench keeps destructive statements behind a WHERE guard", () => {
  assert.ok(source.includes('if (!form.conditions.some((condition) => condition.column.trim()))'), "UPDATE and DELETE must require at least one WHERE condition");
  assert.ok(source.includes("DELETE без WHERE заблокирован конструктором"), "DELETE must stay protected without WHERE");
});

test("database workbench validates identifiers and previews literal parameter values", () => {
  assert.ok(source.includes("function validIdentifier(value: string)"));
  assert.ok(source.includes("function sqlLiteral(value: string)"));
  assert.ok(source.includes("value.replace(/'/g, \"''\")"), "string values must escape single quotes");
  assert.ok(source.includes('const q = (name: string) => name;'), "identifiers must be shown without quotes");
  assert.ok(source.includes("placeholder(condition.value)"), "each condition value must be included in the SQL preview");
  assert.ok(source.includes('"\\nFROM " + tableSql'), "SELECT preview must use readable multiline formatting");
});

test("database workbench uses the requested Russian field labels", () => {
  assert.ok(source.includes("Название таблицы"));
  assert.ok(source.includes("Столбцы, которые нужно вывести через запятую"));
  assert.ok(source.includes("Значения будут безопасно экранированы и показаны непосредственно в готовом SQL."));
});


test("new WHERE conditions initialize every required FilterCondition field", () => {
  assert.ok(source.includes('closeGroups: 0, negate: false, subqueryTable: "orders"'), "new conditions must initialize negate and nested-subquery fields required by FilterCondition");
});

test("database workbench supports multiple WHERE conditions with AND and OR", () => {
  assert.ok(source.includes("type FilterCondition ="));
  assert.ok(source.includes("conditions: FilterCondition[]"));
  assert.ok(source.includes("const addCondition ="));
  assert.ok(source.includes("const removeCondition ="));
  assert.ok(source.includes('option value="AND"'));
  assert.ok(source.includes('option value="OR"'));
  assert.ok(source.includes('clauses.join("\\\\n  ")') || source.includes('clauses.join("\\n  ")'));
  assert.ok(source.includes("Заполни столбец во всех добавленных условиях или удали пустое условие."));
  assert.ok(source.includes("AND имеет более высокий приоритет, чем OR"), "SQL builder must explain AND precedence over OR");
  assert.ok(source.includes("A OR B AND C читается как A OR (B AND C)"), "SQL builder must show the default logical grouping");
  assert.ok(source.includes("openGroups: number; closeGroups: number; negate: boolean"), "each condition must support nested groups and NOT");
  assert.ok(source.includes('condition.negate ? "NOT " : ""'), "the WHERE builder must generate NOT for selected conditions");
  assert.ok(source.includes("Применить NOT к этому условию"), "the UI must expose per-condition NOT");
  assert.ok(source.includes("depth !== 0"), "unbalanced groups must be rejected");
  assert.ok(source.includes("Открыть скобки перед условием") && source.includes("Закрыть скобки после условия"), "the UI must expose nested group controls");
  assert.ok(source.includes('"BETWEEN"'), "SQL builder must offer BETWEEN");
  assert.ok(source.includes('operator === "BETWEEN"'), "SQL builder must generate a BETWEEN expression");
  assert.ok(source.includes("укажи две границы через запятую"), "BETWEEN must validate both range boundaries");
  assert.ok(source.includes("BETWEEN и IN имеют тот же приоритет"), "SQL builder must explain BETWEEN and IN precedence");
});

test("WHERE conditions can compose multiple IN and NOT IN subqueries", () => {
  assert.ok(source.includes('"IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)"'), "WHERE must offer IN and correlated EXISTS subquery operators");
  assert.ok(source.includes('operator === "IN (подзапрос)" || operator === "NOT IN (подзапрос)"'), "the SQL builder must generate subqueries as individual WHERE predicates");
  assert.ok(source.includes('condition.subqueryTable.trim()') && source.includes('condition.subquerySelectColumn.trim()'), "each nested predicate must configure its own inner table and result column");
  assert.ok(source.includes('condition.subqueryFilterColumn.trim()'), "each nested predicate must support its own optional inner filter");
  assert.ok(source.includes('operator === "EXISTS (подзапрос)" ? "EXISTS" : "NOT EXISTS"'), "correlated EXISTS predicates must link the inner key to the outer condition column");
  assert.ok(source.includes('["IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)"].includes(condition.operator)'), "the UI must expose per-condition subquery fields");
  assert.ok(source.includes("Можно добавить несколько таких условий и объединить их через AND/OR и скобки."), "subquery predicates must compose with normal filters and nested groups");
});

test("database workbench explains LIKE wildcard characters", () => {
  assert.ok(source.includes('condition.operator === "LIKE" ? "Шаблон LIKE"'), "LIKE should have a dedicated field label");
  assert.ok(source.includes("Например: Ан%, %ов, а_я"), "LIKE should show wildcard examples");
  assert.ok(source.includes("% означает ноль или более любых символов"), "LIKE help must explain percent wildcard");
  assert.ok(source.includes("_ — ровно один любой символ"), "LIKE help must explain underscore wildcard");
});

test("database workbench handles PostgreSQL and MySQL syntax differences", () => {
  assert.ok(source.includes('dialect === "mysql"'));
  assert.ok(source.includes("MySQL не поддерживает FULL OUTER JOIN напрямую"));
});

test("database workbench never executes SQL or connects to a database", () => {
  assert.ok(source.includes("он не подключается к БД и ничего не выполняет"));
  assert.equal(/\b(mysql2|pg|sequelize|prisma|knex)\b/.test(source), false);
});

test("database workbench builds grouped aggregate queries with distinct counts and aliases", () => {
  assert.ok(source.includes('type Operation = "select" | "aggregate"'), "GROUP BY must be available as a builder operation");
  assert.ok(source.includes('case "aggregate":'), "aggregate operation must generate SQL");
  assert.ok(source.includes('"COUNT(DISTINCT " + q(column) + ")"'), "distinct book counting must use a unique book identifier");
  assert.ok(source.includes('"COUNT(*) AS " + aliasSql(alias)'), "COUNT(*) must support counting physical-copy rows");
  assert.ok(source.includes('" + groupColumns.map(q).join(", ") + having + sorting + limit + offset + ";"'), "aggregate queries must retain GROUP BY before optional HAVING, sorting and pagination");
  assert.ok(source.includes("groupAliases") && source.includes("aliasSql"), "grouped and aggregate output columns must support aliases");
  assert.ok(source.includes('groupBy: "", groupAliases: ""'), "GROUP BY must not default to a domain-specific column");
  assert.ok(source.includes('{ id: 1, fn: "COUNT", column: "*", alias: "total" }'), "aggregate metrics must start with a neutral COUNT(*) example");
  assert.ok(source.includes('form.groupAliases.trim() ? form.groupAliases.split(",")'), "group-column aliases must be optional");
  assert.ok(source.includes("Можно группировать по любым полям текущей таблицы"), "the UI must describe schema-agnostic grouping");
  assert.ok(!source.includes('groupBy: "author"'), "author must not be hard-coded as the grouping column");
  assert.ok(!source.includes('table: current.table === "users" ? "books" : current.table'), "switching to aggregation must not force a books table");
  assert.ok(source.includes('title: "Различные книги и экземпляры по авторам"'));
  assert.ok(source.includes("если в строке хранится количество в поле quantity, используй SUM(quantity)"), "the reference must explain the alternative quantity-column schema");
  assert.ok(source.includes('dialect === "mysql"'), "aliases must be quoted according to the SQL dialect");
});

test("SELECT supports DISTINCT and validated pagination", () => {
  assert.ok(source.includes('form.distinct ? "DISTINCT " : ""'), "SELECT must support DISTINCT");
  assert.ok(source.includes('offset: "", distinct: false'), "pagination and DISTINCT state must be initialized");
  assert.ok(source.includes("OFFSET должен быть"), "OFFSET must be validated");
  assert.ok(source.includes("LIMIT должен быть"), "LIMIT must be validated instead of silently ignored");
  assert.ok(source.includes('update("distinct", event.target.checked)'), "DISTINCT checkbox must store a boolean");
});

test("aggregate queries support HAVING, ORDER BY and pagination", () => {
  assert.ok(source.includes('havingAlias: string'));
  assert.ok(source.includes('"\\nHAVING " + (dialect === "mysql" ? q(form.havingAlias.trim()) : havingTarget)'), "HAVING must filter grouped results with dialect-aware expressions");
  assert.ok(source.includes('havingMetric.fn === "COUNT_DISTINCT"'), "PostgreSQL HAVING must use the aggregate expression rather than a SELECT alias");
  assert.ok(source.includes('"\\nORDER BY " + q(form.orderColumn.trim())'), "aggregate results must be sortable");
  assert.ok(source.includes('"\\nLIMIT " + Number(form.limit)'), "aggregate results must support LIMIT");
  assert.ok(source.includes('"\\nOFFSET " + Number(form.offset)'), "aggregate results must support OFFSET");
  assert.ok(source.includes("const whereClause = where();"), "WHERE parameters must be registered before HAVING parameters");
});


test("JOIN supports multiple related tables and WHERE filtering", () => {
  assert.ok(source.includes("const joinedTables = splitIdentifiers(form.secondTable)"), "JOIN must accept multiple table names");
  assert.ok(source.includes("leftKeys.length !== joinedTables.length"), "JOIN must validate matching key pairs");
  assert.ok(source.includes('joins + where() + ";"'), "JOIN must support filtering after ON clauses");
  assert.ok(source.includes('operation === "join" || operation === "update"'), "JOIN must expose WHERE conditions in the UI");
  assert.ok(source.includes("Дополнительные таблицы (через запятую)"), "UI must explain multi-table input");
});

test("HAVING can only target a configured aggregate alias", () => {
  assert.ok(source.includes("form.aggregates.some((metric) => metric.alias.trim() === form.havingAlias.trim())"));
  assert.ok(source.includes("Псевдоним HAVING должен совпадать"), "HAVING must reject unknown aliases");
});

test("SQL workbench provides a validated subquery builder", () => {
  assert.ok(source.includes('type SubqueryMode = "SCALAR" | "IN" | "NOT IN" | "EXISTS" | "NOT EXISTS"'));
  assert.ok(source.includes('case "subquery":'), "subquery operation must generate SQL");
  assert.ok(source.includes('form.subqueryMode === "EXISTS" || form.subqueryMode === "NOT EXISTS"'), "EXISTS variants must be correlated to the outer query");
  assert.ok(source.includes('form.subqueryMode === "IN" || form.subqueryMode === "NOT IN"'), "IN variants must select values from the inner query");
  assert.ok(source.includes("innerFilter.slice(7)"), "optional inner filters must be combined with the correlation condition");
  assert.ok(source.includes("Подзапросы — IN / EXISTS / SELECT"), "subquery builder must be selectable in the UI");
});

test("SQL workbench provides a configurable CTE builder", () => {
  assert.ok(source.includes('case "cte":'), "CTE operation must generate SQL");
  assert.ok(source.includes('type Operation = "select" | "aggregate" | "join" | "subquery" | "cte"'), "CTE must be a distinct builder operation");
  assert.ok(source.includes("cteResultColumns.map(q).join"), "outer SELECT must choose from the CTE output columns");
  assert.ok(source.includes("cteFilterColumn") && source.includes("cteOuterFilterColumn"), "CTE and outer SELECT filters must be independent");
  assert.ok(source.includes("Именованный набор — CTE / WITH"), "CTE builder must be available in the operation selector");
});

test("CTE builder validates the scope of selected and filtered columns", () => {
  assert.ok(source.includes("cteResultColumns.some((column) => !cteColumns.includes(column))"), "outer SELECT must not request columns missing from the CTE");
  assert.ok(source.includes("!cteColumns.includes(outerFilterColumn)"), "outer WHERE must only reference columns exposed by the CTE");
});


test("WHERE filters can disambiguate columns in joined tables", () => {
  assert.ok(source.includes("function validColumnReference(value: string)"), "qualified column validation must be available");
  assert.ok(source.includes("!validColumnReference(condition.column.trim())"), "WHERE must accept table.column and reject malformed references");
  assert.ok(source.includes("ссылкой table.column"), "the validation message must explain qualified columns");
});

test("SQL workbench excludes the standalone practice mode and its answer checker", () => {
  assert.equal(source.includes('title: "Практика SQL"'), false);
  assert.equal(source.includes('Проверить ответ'), false);
  assert.equal(source.includes("const practiceTasks = ["), false);
  assert.equal(source.includes("practiceTasks[practiceIndex]"), false);
});

test("SQL reference omits the removed advanced example set", () => {
  for (const title of ["Постраничный вывод агрегатов", "Записи выше среднего", "Проверка наличия связанной записи", "Временный именованный набор", "Условное значение через CASE"]) {
    assert.equal(source.includes('title: "' + title + '"'), false, "removed SQL reference entry remains: " + title);
  }
});
