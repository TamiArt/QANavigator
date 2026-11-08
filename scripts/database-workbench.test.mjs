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
  assert.ok(source.includes('"BETWEEN"'), "SQL builder must offer BETWEEN");
  assert.ok(source.includes('operator === "BETWEEN"'), "SQL builder must generate a BETWEEN expression");
  assert.ok(source.includes("укажи две границы через запятую"), "BETWEEN must validate both range boundaries");
  assert.ok(source.includes("BETWEEN и IN имеют тот же приоритет"), "SQL builder must explain BETWEEN and IN precedence");
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
  assert.ok(source.includes('" + groupColumns.map(q).join(", ") + ";"'), "aggregate queries must group by the selected author column");
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
  assert.ok(source.includes('"\\nHAVING " + q(form.havingAlias.trim())'), "HAVING must filter grouped results");
  assert.ok(source.includes('"\\nORDER BY " + q(form.orderColumn.trim())'), "aggregate results must be sortable");
  assert.ok(source.includes('"\\nLIMIT " + Number(form.limit)'), "aggregate results must support LIMIT");
  assert.ok(source.includes('"\\nOFFSET " + Number(form.offset)'), "aggregate results must support OFFSET");
  assert.ok(source.includes("const whereClause = where();"), "WHERE parameters must be registered before HAVING parameters");
});

test("SQL trainer includes guided practice and advanced SQL reference examples", () => {
  assert.ok(source.includes('id: "practice" as const'), "practice must be available as a separate workbench tab");
  assert.ok(source.includes("Проверить ответ"), "practice must provide answer feedback");
  assert.ok(source.includes("не заменяет выполнение запроса"), "practice feedback must disclose its limits");
  for (const keyword of ["EXISTS", "WITH order_totals", "CASE WHEN", "SELECT DISTINCT"]) {
    assert.ok(source.includes(keyword), "SQL reference is missing " + keyword);
  }
});
