import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildNestedScalarSubquery, buildCorrelatedExistsSubquery } from "../src/app/features/database-workbench/nested-subquery-builder.mjs";
import { buildAdvancedSelect } from "../src/app/features/database-workbench/advanced-select-builder.mjs";
import { buildCreateTable, buildAlterTable, buildDropTable, buildTruncateTable, buildInsert, buildUpdate, buildDelete } from "../src/app/features/database-workbench/ddl-dml-builder.mjs";
import initSqlJs from "sql.js";
import { executeSqlBatch, splitSqlStatements } from "../src/app/features/database-workbench/sql-execution.mjs";
import { adaptSqlForSqlite, registerSqlCompatibilityFunctions } from "../src/app/features/database-workbench/sql-dialect-compat.mjs";
import { SQL_TRAINER_SEED_SQL } from "../src/app/features/database-workbench/sql-seed.mjs";

const source = await readFile("src/app/features/database-workbench/DatabaseWorkbenchModule.tsx", "utf8");
const nestedBuilderSource = await readFile("src/app/features/database-workbench/nested-subquery-builder.mjs", "utf8");
const ddlDmlBuilderSource = await readFile("src/app/features/database-workbench/ddl-dml-builder.mjs", "utf8");

test("database workbench exposes practical SQL operations", () => {
  for (const operation of ["SELECT", "JOIN", "INSERT", "UPDATE", "DELETE", "RENAME", "AS"]) {
    assert.ok(source.includes(operation), "workbench is missing " + operation);
  }
});

test("database workbench keeps destructive statements behind a WHERE guard", () => {
  assert.ok(source.includes("buildUpdate({ dialect, table, assignments: form.updateAssignments"), "UPDATE must delegate to the guarded DML builder");
  assert.ok(source.includes("buildDelete({ dialect, table, where:"), "DELETE must delegate to the guarded DML builder");
  assert.ok(ddlDmlBuilderSource.includes("Для безопасности UPDATE обязательно задай WHERE"), "UPDATE must reject an empty WHERE");
  assert.ok(ddlDmlBuilderSource.includes("DELETE без WHERE заблокирован конструктором"), "DELETE must stay protected without WHERE");
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

test("WHERE conditions can compose IN, NOT IN and correlated EXISTS subqueries", () => {
  assert.ok(source.includes('"IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)"'), "WHERE must offer IN and correlated EXISTS subquery operators");
  assert.ok(source.includes('operator === "IN (подзапрос)" || operator === "NOT IN (подзапрос)"'), "the SQL builder must generate subqueries as individual WHERE predicates");
  assert.ok(source.includes('condition.subqueryTable.trim()') && source.includes('condition.subquerySelectColumn.trim()'), "each nested predicate must configure its own inner table and result column");
  assert.ok(source.includes('condition.subqueryFilterColumn.trim()'), "each nested predicate must support its own optional inner filter");
  assert.ok(source.includes('operator === "EXISTS (подзапрос)" ? "EXISTS" : "NOT EXISTS"'), "correlated EXISTS predicates must link the inner key to the outer condition column");
  assert.ok(source.includes('["IN (подзапрос)", "NOT IN (подзапрос)", "EXISTS (подзапрос)", "NOT EXISTS (подзапрос)"].includes(condition.operator)'), "the UI must expose per-condition subquery fields");
  assert.ok(source.includes("Подзапрос встраивается в WHERE, поэтому несколько таких условий можно объединять с обычными через AND/OR и скобки."), "subquery predicates must compose with normal filters and nested groups");
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

test("database workbench executes SQL only in an isolated in-browser database", async () => {
  const consoleSource = await readFile("src/app/features/database-workbench/SqlExecutionConsole.tsx", "utf8");
  assert.ok(source.includes("SqlExecutionConsole"));
  assert.ok(consoleSource.includes("SQLite в WebAssembly"));
  assert.ok(consoleSource.includes("отдельной SQLite-базе прямо в браузере"));
  assert.equal(/\b(mysql2|pg|sequelize|prisma|knex)\b/.test(source + consoleSource), false);
});

test("database workbench builds grouped aggregate queries with distinct counts and aliases", () => {
  assert.ok(source.includes('type Operation = "select" | "aggregate"'), "GROUP BY must be available as a builder operation");
  assert.ok(source.includes('case "aggregate":'), "aggregate operation must generate SQL");
  assert.ok(source.includes('"COUNT(DISTINCT " + q(column) + ")"'), "distinct book counting must use a unique book identifier");
  assert.ok(source.includes('metric.fn === "COUNT" && column === "*"'), "COUNT(*) must support counting physical-copy rows");
  assert.ok(source.includes('const groupByClause = groupColumns.length ?') && source.includes(" + groupByClause + having + sorting + limit + offset + \";\""), "aggregate queries must include GROUP BY only when configured");
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
  assert.ok(source.includes("aggregateSqlExpression(havingMetric, q)"), "PostgreSQL HAVING must use the configured aggregate expression rather than a SELECT alias");
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

test("SQL trainer builds CREATE TABLE AS with scalar subqueries in SELECT and WHERE", () => {
  assert.ok(source.includes('type Operation = "select" | "aggregate" | "join" | "subquery" | "cte" | "createTableAs"'), "CREATE TABLE AS must be a selectable operation");
  assert.ok(source.includes('case "createTableAs":'), "the operation must generate SQL");
  assert.ok(source.includes('ctasTable: "ordering"') && source.includes('ctasSourceTable: "book"'), "the builder must configure target and source tables");
  assert.ok(source.includes('const scalar = "(SELECT " + scalarSelect + " FROM " + q(sourceTable) + scalarFilter + ")"'), "the scalar subquery must support either an aggregate or a plain selected column");
  assert.ok(source.includes('scalar + " AS " + q(selectAlias)'), "SELECT must expose the scalar subquery under a configurable alias");
  assert.ok(source.includes('q(whereColumn) + " " + form.ctasWhereOperator + " " + scalar'), "WHERE must compare an outer column with the scalar subquery");
  assert.ok(source.includes('form.ctasAppendSelect ? "\\n\\nSELECT * FROM "'), "the builder must optionally append a follow-up SELECT from the created table");
  assert.ok(source.includes("Скалярный подзапрос в SELECT") && source.includes("Скалярный подзапрос в WHERE"), "the UI must expose both scalar-subquery positions");
  assert.ok(source.includes("CREATE TABLE AS создаёт физическую таблицу"), "the UI must distinguish a created table from a CTE");
  assert.ok(source.includes("ctasScalarFilterEnabled") && source.includes("ctasSubqueryLevels"), "the scalar subquery must support dynamically configured nested SELECT levels");
  assert.ok(source.includes("Обычный столбец") && source.includes("не более одной строки"), "the UI must explain plain scalar-column selection and its single-row requirement");
});


test("CREATE TABLE AS scalar subqueries use a dynamic independently configurable level collection", () => {
  assert.ok(source.includes("type SubqueryLevel ="));
  assert.ok(source.includes("ctasSubqueryLevels: SubqueryLevel[]"));
  assert.ok(source.includes("form.ctasSubqueryLevels"));
  assert.ok(nestedBuilderSource.includes("for (let index = levels.length - 1; index >= 0; index -= 1)"), "SQL generation must fold any configured number of levels from deepest to outermost");
  assert.ok(source.includes("ctasSubqueryLevels: [...current.ctasSubqueryLevels"), "the UI must allow adding levels dynamically");
  assert.ok(source.includes("ctasSubqueryLevels.filter((item) => item.id !== level.id)"), "the UI must allow removing an individual level");
  assert.ok(source.includes("Каждый уровень имеет собственные SELECT, FROM и WHERE"), "the UI must explain independent configuration at every level");
  assert.ok(source.includes("index === current.ctasSubqueryLevels.length - 1 ? { ...level, filterEnabled: true } : level"), "adding a deeper level must automatically connect it through the previous level WHERE");
  assert.equal(/ctasNested(?:Table|SelectKind|Aggregate|Column|Filter)/.test(source), false, "fixed second-level state must be removed completely");
});


test("dynamic scalar subquery levels validate their own tables, columns and WHERE operators", () => {
  assert.ok(nestedBuilderSource.includes("Проверь таблицу и столбец результата во вложенном SELECT"));
  assert.ok(nestedBuilderSource.includes("Укажи корректный столбец WHERE"));
  assert.ok(nestedBuilderSource.includes("Недопустимый оператор WHERE"));
  assert.ok(nestedBuilderSource.includes("Чтобы вложить следующий уровень, включи WHERE"));
  assert.ok(nestedBuilderSource.includes("const rightSide = nested || toSqlValue"), "each level must either compare with a literal value or the next nested SELECT");
});

const level = (id, overrides = {}) => ({
  id, table: "book", selectKind: "aggregate", aggregate: "AVG", column: "amount",
  filterEnabled: false, filterColumn: "amount", filterOperator: ">", filterValue: "0",
  ...overrides,
});
const quoteIdentifier = (value) => '"' + value + '"';
const toSqlValue = (value) => "'" + value.replace(/'/g, "''") + "'";

test("universal nested builder generates three and four independent SELECT levels", () => {
  const threeLevels = [
    level(2, { filterEnabled: true, filterColumn: "amount", filterOperator: ">", filterValue: "" }),
    level(3, { table: "authors", selectKind: "column", column: "id", filterEnabled: true, filterColumn: "country", filterOperator: "=", filterValue: "7" }),
  ];
  const threeSql = buildNestedScalarSubquery(threeLevels, quoteIdentifier, toSqlValue);
  assert.equal(threeSql, '(SELECT AVG("amount") FROM "book" WHERE "amount" > (SELECT "id" FROM "authors" WHERE "country" = \'7\'))');

  const fourLevels = [
    level(2, { filterEnabled: true, filterColumn: "amount", filterOperator: ">", filterValue: "" }),
    level(3, { filterEnabled: true, filterColumn: "amount", filterOperator: "<", filterValue: "" }),
    level(4, { filterEnabled: true, filterColumn: "author_id", filterOperator: "=", filterValue: "0" }),
  ];
  const fourSql = buildNestedScalarSubquery(fourLevels, quoteIdentifier, toSqlValue);
  assert.equal((fourSql.match(/SELECT/g) ?? []).length, 3);
  assert.match(fourSql, /WHERE "amount" > \(SELECT AVG/);
  assert.match(fourSql, /WHERE "amount" < \(SELECT AVG/);
  assert.match(fourSql, /WHERE "author_id" = '0'\)/);
});

test("universal nested builder supports aggregate and plain-column result modes at every depth", () => {
  const sql = buildNestedScalarSubquery([
    level(2, { selectKind: "column", column: "title", filterEnabled: true, filterValue: "" }),
    level(3, { selectKind: "aggregate", aggregate: "MAX", column: "amount" }),
  ], quoteIdentifier, toSqlValue);
  assert.match(sql, /^\(SELECT "title" FROM "book" WHERE "amount" > \(SELECT MAX\("amount"\) FROM "book"\)\)$/);
});

test("universal nested builder rejects invalid or disconnected levels", () => {
  assert.throws(() => buildNestedScalarSubquery([], quoteIdentifier, toSqlValue), /Добавь хотя бы один уровень/);
  assert.throws(() => buildNestedScalarSubquery([level(2, { table: "book; DROP TABLE users" })], quoteIdentifier, toSqlValue), /Проверь таблицу и столбец/);
  assert.throws(() => buildNestedScalarSubquery([level(2, { aggregate: "COUNT" })], quoteIdentifier, toSqlValue), /допустимую агрегатную функцию/);
  assert.throws(() => buildNestedScalarSubquery([
    level(2, { filterEnabled: false }),
    level(3),
  ], quoteIdentifier, toSqlValue), /включи WHERE уровня 2/);
  assert.throws(() => buildNestedScalarSubquery([
    level(2, { filterEnabled: true, filterValue: "" }),
  ], quoteIdentifier, toSqlValue), /Укажи значение WHERE уровня 2/);
});

test("universal nested builder escapes values through the supplied SQL dialect formatter", () => {
  const sql = buildNestedScalarSubquery([
    level(2, { filterEnabled: true, filterColumn: "author", filterOperator: "=", filterValue: "O'Reilly" }),
  ], quoteIdentifier, toSqlValue);
  assert.match(sql, /WHERE "author" = 'O''Reilly'/);
});

const quoteCorrelated = (value) => '"' + value.replace(/"/g, '""') + '"';
test("correlated EXISTS resolves immediate and outer lexical scopes across nested levels", () => {
  const sql = buildCorrelatedExistsSubquery({
    outer: { table: "users", alias: "u" },
    levels: [
      { table: "orders", alias: "o", innerColumn: "user_id", outerDepth: 1, outerColumn: "id", filterEnabled: true, filterColumn: "status", filterOperator: "=", filterValue: "paid" },
      { table: "payments", alias: "p", innerColumn: "order_id", outerDepth: 1, outerColumn: "id", filterEnabled: true, filterColumn: "state", filterOperator: "=", filterValue: "settled" },
      { table: "audit", alias: "a", innerColumn: "user_id", outerDepth: 3, outerColumn: "id" },
    ],
  }, quoteCorrelated, toSqlValue);
  assert.equal(sql, 'EXISTS (SELECT 1 FROM "orders" AS "o" WHERE "o"."user_id" = "u"."id" AND "o"."status" = \'paid\' AND EXISTS (SELECT 1 FROM "payments" AS "p" WHERE "p"."order_id" = "o"."id" AND "p"."state" = \'settled\' AND EXISTS (SELECT 1 FROM "audit" AS "a" WHERE "a"."user_id" = "u"."id")))');
});
test("correlated NOT EXISTS is generated as a negated correlated predicate", () => {
  const sql = buildCorrelatedExistsSubquery({ mode: "NOT EXISTS", outer: { table: "users", alias: "u" }, levels: [{ table: "orders", alias: "o", innerColumn: "user_id", outerDepth: 1, outerColumn: "id" }] }, quoteCorrelated, toSqlValue);
  assert.equal(sql, 'NOT EXISTS (SELECT 1 FROM "orders" AS "o" WHERE "o"."user_id" = "u"."id")');
});
test("correlated builder rejects unknown scopes, duplicate aliases, and unsafe identifiers", () => {
  const base = { outer: { table: "users", alias: "u" }, levels: [{ table: "orders", alias: "o", innerColumn: "user_id", outerDepth: 1, outerColumn: "id" }] };
  assert.throws(() => buildCorrelatedExistsSubquery({ ...base, levels: [{ ...base.levels[0], outerDepth: 2 }] }, quoteCorrelated, toSqlValue), /недоступная внешняя область/);
  assert.throws(() => buildCorrelatedExistsSubquery({ ...base, levels: [{ ...base.levels[0], alias: "u" }] }, quoteCorrelated, toSqlValue), /уже используется/);
  assert.throws(() => buildCorrelatedExistsSubquery({ ...base, levels: [{ ...base.levels[0], innerColumn: "id; DROP" }] }, quoteCorrelated, toSqlValue), /Проверь таблицу/);
});
test("correlated builder validates local filters and supports escaped values", () => {
  const sql = buildCorrelatedExistsSubquery({ outer: { table: "users", alias: "u" }, levels: [{ table: "orders", alias: "o", innerColumn: "user_id", outerDepth: 1, outerColumn: "id", filterEnabled: true, filterColumn: "status", filterOperator: "=", filterValue: "O'Reilly" }] }, quoteCorrelated, toSqlValue);
  assert.match(sql, /'O''Reilly'/);
  assert.throws(() => buildCorrelatedExistsSubquery({ outer: { table: "users", alias: "u" }, levels: [{ table: "orders", alias: "o", innerColumn: "user_id", outerDepth: 1, outerColumn: "id", filterEnabled: true, filterColumn: "status", filterValue: "" }] }, quoteCorrelated, toSqlValue), /Укажи значение локального WHERE/);
});
test("SQL workbench exposes configurable correlated scopes and nested EXISTS levels", () => {
  assert.ok(source.includes("correlatedLevels: CorrelatedSubqueryLevel[]"));
  assert.ok(source.includes("form.correlatedLevels.map"));
  assert.ok(source.includes("Псевдоним внешней таблицы"));
  assert.ok(source.includes("Уровень внешней ссылки"));
  assert.ok(source.includes("Добавить вложенный уровень"));
  assert.ok(source.includes("buildCorrelatedExistsSubquery"));
});


test("advanced SELECT combines multiple joins, CASE, arithmetic aggregates, grouping, HAVING and ordering", () => {
  const result = buildAdvancedSelect({
    table: "users",
    fromAlias: "u",
    distinct: true,
    selectItems: "u.id AS user_id\nu.email\nCOUNT(DISTINCT o.id) AS orders_count\nSUM(o.quantity * o.price) AS gross\nCASE WHEN COUNT(o.id) > 0 THEN 1 ELSE 0 END AS has_orders",
    joins: "LEFT JOIN orders AS o ON o.user_id = u.id\nLEFT JOIN payments AS p ON p.order_id = o.id",
    whereClause: "\nWHERE u.active = TRUE",
    groupBy: "u.id, u.email",
    having: "COUNT(o.id) > 1\nOR SUM(o.quantity * o.price) >= 100",
    orderBy: "orders_count DESC, u.email ASC",
    limit: "25",
    offset: "10",
  });
  assert.match(result.sql, /^SELECT DISTINCT u\.id AS user_id,/);
  assert.match(result.sql, /LEFT JOIN orders AS o ON o\.user_id = u\.id/);
  assert.match(result.sql, /LEFT JOIN payments AS p ON p\.order_id = o\.id/);
  assert.match(result.sql, /CASE WHEN COUNT\(o\.id\) > 0 THEN 1 ELSE 0 END AS has_orders/);
  assert.match(result.sql, /GROUP BY u\.id, u\.email/);
  assert.match(result.sql, /HAVING COUNT\(o\.id\) > 1\s+OR SUM\(o\.quantity \* o\.price\) >= 100/);
  assert.match(result.sql, /ORDER BY orders_count DESC, u\.email ASC/);
  assert.match(result.sql, /LIMIT 25\s+OFFSET 10;$/);
  assert.deepEqual(
    { joins: result.joinCount, groups: result.groupCount, having: result.havingCount, order: result.orderCount },
    { joins: 2, groups: 2, having: 2, order: 2 },
  );
});

test("advanced SELECT supports INNER, RIGHT and FULL OUTER joins in a multi-join chain", () => {
  const sql = buildAdvancedSelect({
    table: "authors",
    fromAlias: "a",
    selectItems: "a.id, b.title",
    joins: "INNER JOIN books AS b ON b.author_id = a.id\nRIGHT JOIN stock AS s ON s.book_id = b.id\nFULL OUTER JOIN publishers AS p ON p.id = b.publisher_id",
  }).sql;
  assert.match(sql, /INNER JOIN books AS b/);
  assert.match(sql, /RIGHT JOIN stock AS s/);
  assert.match(sql, /FULL OUTER JOIN publishers AS p/);
});

test("advanced SELECT rejects unsafe expressions, malformed joins, invalid grouping and unsafe pagination", () => {
  const base = { table: "users", selectItems: "id" };
  assert.throws(() => buildAdvancedSelect({ ...base, selectItems: "id; DROP TABLE users" }), /Недопустимое SELECT-выражение/);
  assert.throws(() => buildAdvancedSelect({ ...base, joins: "LEFT JOIN orders ON 1 = 1" }), /JOIN №1/);
  assert.throws(() => buildAdvancedSelect({ ...base, groupBy: "id; DROP TABLE users" }), /GROUP BY/);
  assert.throws(() => buildAdvancedSelect({ ...base, having: "id > 1" }), /должен содержать агрегатную функцию/);
  assert.throws(() => buildAdvancedSelect({ ...base, limit: "1; DROP TABLE users" }), /LIMIT/);
  assert.throws(() => buildAdvancedSelect({ ...base, offset: "-1" }), /OFFSET/);
});

test("advanced SELECT mode is integrated with the shared WHERE editor and SQL preview", () => {
  assert.ok(source.includes('type Operation = "select" | "aggregate" | "join"') && source.includes('"advancedSelect"'));
  assert.ok(source.includes('case "advancedSelect":'));
  assert.ok(source.includes('value="advancedSelect"'));
  assert.ok(source.includes("form.advancedSelectItems"));
  assert.ok(source.includes("form.advancedJoins"));
  assert.ok(source.includes("form.advancedGroupBy"));
  assert.ok(source.includes("form.advancedHaving"));
  assert.ok(source.includes("form.advancedOrderBy"));
  assert.ok(source.includes('operation === "select" || operation === "advancedSelect" || operation === "aggregate"'));
});


test("advanced SELECT validates join alias scope and rejects unsupported MySQL FULL OUTER JOIN", () => {
  const base = { table: "users", fromAlias: "u", selectItems: "u.id" };
  assert.throws(() => buildAdvancedSelect({ ...base, joins: "LEFT JOIN orders AS o ON o.user_id = missing.id" }), /неизвестный псевдоним/);
  assert.throws(() => buildAdvancedSelect({ ...base, joins: "LEFT JOIN orders AS u ON u.user_id = u.id" }), /уже используется/);
  assert.throws(() => buildAdvancedSelect({ ...base, dialect: "mysql", joins: "FULL OUTER JOIN orders AS o ON o.user_id = u.id" }), /MySQL не поддерживает FULL OUTER JOIN/);
  assert.match(buildAdvancedSelect({ ...base, dialect: "postgres", joins: "FULL OUTER JOIN orders AS o ON o.user_id = u.id" }).sql, /FULL OUTER JOIN/);
});


test("DDL CREATE TABLE supports typed columns and common constraints", () => {
  const result = buildCreateTable({
    dialect: "postgres",
    table: "orders",
    columns: "id BIGINT PRIMARY KEY\nuser_id BIGINT NOT NULL REFERENCES users(id)\namount DECIMAL(10,2) NOT NULL CHECK (amount > 0)\nstatus VARCHAR(30) DEFAULT 'new'\ncreated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  });
  assert.equal(result.columnCount, 5);
  assert.match(result.sql, /CREATE TABLE "orders"/);
  assert.match(result.sql, /"user_id" BIGINT NOT NULL REFERENCES "users" \("id"\)/);
  assert.match(result.sql, /DECIMAL\(10,2\) NOT NULL CHECK \(amount > 0\)/);
  assert.match(result.sql, /DEFAULT 'new'/);
  assert.throws(() => buildCreateTable({ table: "orders", columns: "id BOGUS" }), /неподдерживаемый тип данных/);
  assert.throws(() => buildCreateTable({ table: "orders", columns: "id INT\nid TEXT" }), /уникальными/);
  assert.throws(() => buildCreateTable({ table: "orders", columns: "id INT; DROP TABLE users" }), /недопустимые символы|не удалось разобрать/);
});

test("DDL ALTER TABLE supports add, drop, rename and dialect-specific type changes", () => {
  assert.match(buildAlterTable({ table: "users", action: "add", column: "phone", definition: "phone VARCHAR(30) NOT NULL" }).sql, /ADD COLUMN "phone" VARCHAR\(30\) NOT NULL/);
  assert.match(buildAlterTable({ table: "users", action: "drop", column: "phone" }).sql, /DROP COLUMN "phone"/);
  assert.match(buildAlterTable({ table: "users", action: "rename", column: "name", newName: "display_name" }).sql, /RENAME COLUMN "name" TO "display_name"/);
  assert.match(buildAlterTable({ dialect: "mysql", table: "users", action: "type", column: "name", dataType: "VARCHAR", typeSize: "255" }).sql, /MODIFY COLUMN .name. VARCHAR\(255\)/);
  assert.match(buildAlterTable({ dialect: "postgres", table: "users", action: "type", column: "name", dataType: "TEXT" }).sql, /ALTER COLUMN "name" TYPE TEXT/);
  assert.throws(() => buildAlterTable({ table: "users", action: "type", column: "name", dataType: "UNSAFE" }), /поддерживаемый тип/);
});

test("destructive DDL requires exact table-name confirmation", () => {
  assert.equal(buildDropTable({ table: "old_users", confirmName: "old_users", ifExists: true }).sql, 'DROP TABLE IF EXISTS "old_users";');
  assert.match(buildTruncateTable({ dialect: "mysql", table: "logs", confirmName: "logs" }).sql, /TRUNCATE TABLE .logs./);
  assert.throws(() => buildDropTable({ table: "users", confirmName: "" }), /повтори имя таблицы/);
  assert.throws(() => buildTruncateTable({ table: "users", confirmName: "user" }), /повтори имя таблицы/);
});

test("DML INSERT supports multiple rows, escaped strings and INSERT SELECT", () => {
  const result = buildInsert({ table: "users", columns: "id, email", rows: "1 | qa@example.com\n2 | O'Neil@example.com" });
  assert.equal(result.rowCount, 2);
  const injected = buildInsert({ table: "users", columns: "email", rows: "x' OR '1'='1" }).sql;
  assert.ok(injected.includes("'x'' OR ''1''=''1'"), "untrusted values must remain escaped string literals");
  assert.match(result.sql, /VALUES\n  \(1, 'qa@example.com'\),\n  \(2, 'O''Neil@example.com'\);/);
  const insertSelect = buildInsert({ dialect: "mysql", table: "archive", columns: "id, email", selectSql: "SELECT id, email FROM users WHERE active = TRUE" }).sql;
  assert.ok(insertSelect.includes("INSERT INTO \`archive\` (\`id\`, \`email\`)"));
  assert.match(insertSelect, /\nSELECT id, email FROM users WHERE active = TRUE;/);
  assert.throws(() => buildInsert({ table: "users", columns: "id,email", rows: "1|qa\n2" }), /Строка INSERT №2/);
  assert.throws(() => buildInsert({ table: "users", columns: "id", selectSql: "SELECT 1; DROP TABLE users" }), /один безопасный SELECT/);
  assert.throws(() => buildInsert({ dialect: "mysql", table: "users", columns: "id", selectSql: "SELECT LOAD_FILE('/etc/passwd')" }), /один безопасный SELECT/);
});

test("DML UPDATE supports multiple assignments and enforces WHERE", () => {
  const sql = buildUpdate({ table: "users", assignments: "status = active\nupdated_at = CURRENT_TIMESTAMP\nscore = 12", where: "id = 7 AND is_active = TRUE" }).sql;
  assert.match(sql, /SET "status" = 'active',\n    "updated_at" = CURRENT_TIMESTAMP,\n    "score" = 12/);
  assert.match(sql, /WHERE id = 7 AND is_active = TRUE;/);
  assert.throws(() => buildUpdate({ table: "users", assignments: "status = active", where: "" }), /обязательно задай WHERE/);
  assert.throws(() => buildUpdate({ table: "users", assignments: "status = active\nstatus = blocked", where: "id = 1" }), /повторяется в SET/);
  assert.throws(() => buildUpdate({ table: "users", assignments: "status = active", where: "id = 1; DROP TABLE users" }), /Недопустимое условие/);
});

test("DML DELETE refuses missing WHERE and destructive SQL fragments", () => {
  assert.equal(buildDelete({ table: "users", where: "id = 7" }).sql, 'DELETE FROM "users"\nWHERE id = 7;');
  assert.throws(() => buildDelete({ table: "users", where: "" }), /DELETE без WHERE/);
  assert.throws(() => buildDelete({ table: "users", where: "1 = 1 OR DROP = 1" }), /Недопустимое условие/);
});

test("DDL and expanded DML operations are wired to the interactive workbench", () => {
  for (const operation of ["createTable", "alterTable", "dropTable", "truncateTable"]) {
    assert.ok(source.includes('value="' + operation + '"'), "missing UI operation " + operation);
    assert.ok(source.includes('case "' + operation + '"'), "missing builder case " + operation);
  }
  assert.ok(source.includes("form.ddlColumns"));
  assert.ok(source.includes("form.alterAction"));
  assert.ok(source.includes("form.confirmTable"));
  assert.ok(source.includes("form.insertSelectSql"));
  assert.ok(source.includes("form.updateAssignments"));
  assert.ok(source.includes("buildInsert({ dialect, table, columns: form.columns, rows: form.insertValues, selectSql: form.insertSelectSql })"));
  assert.ok(source.includes("buildUpdate({ dialect, table, assignments: form.updateAssignments"));
});


test("SQL statement splitter respects quoted semicolons and SQL comments", () => {
  const script = `SELECT ';' AS value; -- ; ignored
SELECT 2; /* ; ignored */ SELECT '[x;y]' AS value;`;
  assert.deepEqual(splitSqlStatements(script), [
    "SELECT ';' AS value",
    "-- ; ignored\nSELECT 2",
    "/* ; ignored */ SELECT '[x;y]' AS value",
  ]);
  assert.throws(() => splitSqlStatements("SELECT 'unfinished"), /незакрытую строку/);
  assert.throws(() => splitSqlStatements("SELECT 1; /* unfinished"), /незакрытый комментарий/);
});

async function createSeededDatabase() {
  const SQL = await initSqlJs();
  const database = new SQL.Database();
  database.run(SQL_TRAINER_SEED_SQL);
  return database;
}

test("SQL execution runs CREATE TABLE AS with nested scalar subqueries and returns actual rows", async (t) => {
  const database = await createSeededDatabase();
  t.after(() => database.close());
  const sql = `DROP TABLE IF EXISTS ordering;
CREATE TABLE ordering AS
SELECT author, title,
       (SELECT AVG(amount) FROM book) AS amount
FROM book
WHERE amount < (SELECT AVG(amount) FROM book);
SELECT * FROM ordering ORDER BY amount;`;
  const result = executeSqlBatch(database, sql);
  assert.equal(result.ok, true);
  assert.equal(result.statementCount, 3);
  assert.equal(result.results.length, 3);
  assert.deepEqual(result.results[2].tables[0].columns, ["author", "title", "amount"]);
  assert.equal(result.results[2].tables[0].rowCount, 3);
  assert.deepEqual(result.results[2].tables[0].rows.map((row) => row[1]).sort(), ["Идиот", "Рассказы", "Евгений Онегин"].sort());
  assert.ok(result.results[2].tables[0].rows.every((row) => row[2] > 0));
});

test("SQL execution preserves NULL values and SQLite three-valued logic", async (t) => {
  const database = await createSeededDatabase();
  t.after(() => database.close());
  const result = executeSqlBatch(database, "SELECT id, last_name, last_name IS NULL AS is_missing FROM users WHERE last_name IS NULL ORDER BY id;");
  assert.equal(result.ok, true);
  assert.deepEqual(result.results[0].tables[0].rows, [[3, null, 1], [5, null, 1]]);
  const aggregate = executeSqlBatch(database, "SELECT COUNT(*) AS all_orders, COUNT(total) AS priced_orders, AVG(total) AS average_total FROM orders;");
  assert.deepEqual(aggregate.results[0].tables[0].rows, [[6, 5, 102.1]]);
});

test("SQL execution applies DDL and DML changes between instructions and reports affected rows", async (t) => {
  const database = await createSeededDatabase();
  t.after(() => database.close());
  const result = executeSqlBatch(database, `CREATE TABLE task_log (id INTEGER PRIMARY KEY, note TEXT);
INSERT INTO task_log (id, note) VALUES (1, 'created'), (2, NULL);
UPDATE task_log SET note = 'updated' WHERE id = 1;
DELETE FROM task_log WHERE id = 2;
SELECT * FROM task_log;`);
  assert.equal(result.ok, true);
  assert.equal(result.results[1].affectedRows, 2);
  assert.equal(result.results[2].affectedRows, 1);
  assert.equal(result.results[3].affectedRows, 1);
  assert.deepEqual(result.results[4].tables[0].rows, [[1, "updated"]]);
});

test("SQL execution stops on the first runtime error and preserves earlier successful statements", async (t) => {
  const database = await createSeededDatabase();
  t.after(() => database.close());
  const result = executeSqlBatch(database, "CREATE TABLE before_error (id INTEGER); INSERT INTO before_error VALUES (7); SELECT * FROM missing_table; SELECT 99;");
  assert.equal(result.ok, false);
  assert.equal(result.failedStatement, 3);
  assert.equal(result.completedCount, 2);
  assert.match(result.error, /no such table/i);
  const persisted = database.exec("SELECT id FROM before_error;");
  assert.deepEqual(persisted[0].values, [[7]]);
});

test("SQL execution rejects empty scripts and caps statement and result counts", async (t) => {
  const database = await createSeededDatabase();
  t.after(() => database.close());
  assert.match(executeSqlBatch(database, "").error, /Добавь SQL-инструкцию/);
  assert.match(executeSqlBatch(database, Array.from({ length: 51 }, () => "SELECT 1").join(";")).error, /не более 50/);
  const large = executeSqlBatch(database, "WITH RECURSIVE numbers(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM numbers WHERE x < 600) SELECT x FROM numbers;");
  assert.equal(large.results[0].tables[0].rowCount, 600);
  assert.equal(large.results[0].tables[0].rows.length, 500);
  assert.equal(large.results[0].tables[0].truncated, true);
});

test("SQL workbench integrates a local execution console and explicit SQLite isolation notice", async () => {
  const consoleSource = await readFile("src/app/features/database-workbench/SqlExecutionConsole.tsx", "utf8");
  assert.ok(source.includes("SqlExecutionConsole"));
  assert.ok(consoleSource.includes("Выполнить SQL"));
  assert.ok(consoleSource.includes("Подставить собранный SQL"));
  assert.ok(consoleSource.includes("SQLite-базе прямо в браузере"));
  assert.ok(consoleSource.includes("SQLite в WebAssembly"));
});


test("PostgreSQL compatibility adapts serial, JSONB, casts, ILIKE and NOW without changing literals or comments", () => {
  const sql = "CREATE TABLE sample (id SERIAL PRIMARY KEY, payload JSONB); SELECT name::TEXT, created_at FROM users WHERE email ILIKE '%EXAMPLE%' AND created_at < NOW(); -- name::INT ILIKE";
  const adapted = adaptSqlForSqlite(sql, "postgres");
  assert.match(adapted, /id INTEGER PRIMARY KEY AUTOINCREMENT/i);
  assert.match(adapted, /payload TEXT/i);
  assert.match(adapted, /CAST\(name AS TEXT\)/i);
  assert.match(adapted, /email\s+LIKE/i);
  assert.match(adapted, /created_at < CURRENT_TIMESTAMP/i);
  assert.match(adapted, /-- name::INT ILIKE/);
});

test("MySQL compatibility adapts INSERT IGNORE, AUTO_INCREMENT, duplicate-key updates and common types", () => {
  const adapted = adaptSqlForSqlite("CREATE TABLE sample (id INT AUTO_INCREMENT PRIMARY KEY, active TINYINT(1), created DATETIME) ENGINE=InnoDB; INSERT IGNORE INTO sample VALUES (1, 1, NOW()) ON DUPLICATE KEY UPDATE active = VALUES(active);", "mysql");
  assert.match(adapted, /id INTEGER PRIMARY KEY AUTOINCREMENT/i);
  assert.match(adapted, /active INTEGER/i);
  assert.match(adapted, /created TEXT/i);
  assert.match(adapted, /INSERT OR IGNORE INTO/i);
  assert.match(adapted, /ON CONFLICT DO UPDATE SET active = excluded\.active/i);
  assert.doesNotMatch(adapted, /ENGINE=/i);
});

test("PostgreSQL and MySQL compatible functions execute in the isolated SQLite database", async (t) => {
  const database = await createSeededDatabase();
  registerSqlCompatibilityFunctions(database);
  t.after(() => database.close());

  const pg = executeSqlBatch(database, "SELECT email::TEXT AS address FROM users WHERE email ILIKE '%EXAMPLE%' ORDER BY id;", "postgres");
  assert.equal(pg.ok, true, pg.error ?? "PostgreSQL-compatible SELECT should execute");
  assert.equal(pg.results[0].tables[0].rowCount, 5);

  const mysql = executeSqlBatch(database, "SELECT CONCAT(first_name, ' ', IFNULL(last_name, '')) AS full_name, IF(last_name IS NULL, 1, 0) AS missing FROM users ORDER BY id;", "mysql");
  assert.equal(mysql.ok, true);
  assert.deepEqual(mysql.results[0].tables[0].rows[2], ["Елена ", 1]);
});

test("dialect-specific DDL and upsert statements execute against the local SQLite engine", async (t) => {
  const database = await createSeededDatabase();
  registerSqlCompatibilityFunctions(database);
  t.after(() => database.close());

  const mysql = executeSqlBatch(database, `CREATE TABLE mysql_items (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(30), active TINYINT(1)) ENGINE=InnoDB;
INSERT INTO mysql_items (label, active) VALUES ('first', 1);
INSERT INTO mysql_items (id, label, active) VALUES (1, 'updated', 0) ON DUPLICATE KEY UPDATE label = VALUES(label), active = VALUES(active);
SELECT id, label, active FROM mysql_items;`, "mysql");
  assert.equal(mysql.ok, true, mysql.error ?? "MySQL-compatible script should execute");
  assert.deepEqual(mysql.results[3].tables[0].rows, [[1, "updated", 0]]);

  const postgres = executeSqlBatch(database, `CREATE TABLE pg_items (id SERIAL PRIMARY KEY, label JSONB); INSERT INTO pg_items (label) VALUES ('{"ok":true}'); SELECT id, label FROM pg_items;`, "postgres");
  assert.equal(postgres.ok, true, postgres.error ?? "PostgreSQL-compatible script should execute");
  assert.deepEqual(postgres.results[2].tables[0].rows, [[1, '{"ok":true}']]);
});

test("dialect adapter leaves quoted identifiers, strings and comments intact", () => {
  const sql = "SELECT `ILIKE`, 'name::INT NOW()' AS literal /* AUTO_INCREMENT */ FROM users -- SERIAL";
  assert.equal(adaptSqlForSqlite(sql, "postgres"), sql);
  assert.equal(adaptSqlForSqlite(sql, "mysql"), sql);
});


test("Student sample supports COUNT(column) with a WHERE filter and returns the expected count", async (t) => {
  const database = await createSeededDatabase();
  registerSqlCompatibilityFunctions(database);
  t.after(() => database.close());

  const result = executeSqlBatch(database, "SELECT COUNT(first_name) AS count FROM Student WHERE first_name = 'Anna';");
  assert.equal(result.ok, true, result.error ?? "Filtered COUNT should execute");
  assert.deepEqual(result.results[0].tables[0].columns, ["count"]);
  assert.deepEqual(result.results[0].tables[0].rows, [[3]]);
  const jsonb = executeSqlBatch(database, "SELECT JSONB_OBJECTAGG(student_id, first_name) AS students FROM Student;", "postgres");
  assert.equal(jsonb.ok, true, jsonb.error ?? "JSONB_OBJECTAGG should execute");
  assert.equal(JSON.parse(jsonb.results[0].tables[0].rows[0][0])["5"], null);
});

test("SQL trainer executes common PostgreSQL and MySQL aggregate function families", async (t) => {
  const database = await createSeededDatabase();
  registerSqlCompatibilityFunctions(database);
  t.after(() => database.close());

  const result = executeSqlBatch(database, `SELECT
    COUNT(*) AS row_count,
    COUNT(first_name) AS named_count,
    SUM(score) AS score_sum,
    AVG(score) AS score_average,
    MIN(score) AS score_min,
    MAX(score) AS score_max,
    GROUP_CONCAT(first_name) AS names,
    STRING_AGG(first_name, ', ') AS names_joined,
    ARRAY_AGG(first_name) AS names_array,
    JSON_AGG(first_name) AS names_json,
    JSON_ARRAYAGG(first_name) AS names_json_array,
    JSON_OBJECTAGG(student_id, first_name) AS names_by_id,
    BOOL_AND(is_active) AS all_active,
    BOOL_OR(is_active) AS any_active,
    EVERY(is_active) AS every_active,
    BIT_AND(student_id) AS bit_and_value,
    BIT_OR(student_id) AS bit_or_value,
    BIT_XOR(student_id) AS bit_xor_value,
    STDDEV(score) AS score_stddev,
    STDDEV_POP(score) AS score_stddev_pop,
    STDDEV_SAMP(score) AS score_stddev_samp,
    VARIANCE(score) AS score_variance,
    VAR_POP(score) AS score_var_pop,
    VAR_SAMP(score) AS score_var_samp,
    MEDIAN(score) AS score_median,
    TOTAL(score) AS score_total,
    ANY_VALUE(first_name) AS arbitrary_name
  FROM Student;`);
  assert.equal(result.ok, true, result.error ?? "Aggregate family query should execute");
  const row = result.results[0].tables[0].rows[0];
  assert.equal(row[0], 6);
  assert.equal(row[1], 5);
  assert.equal(row[2], 433);
  assert.equal(row[3], 86.6);
  assert.equal(row[4], 78);
  assert.equal(row[5], 92);
  assert.match(row[6], /Anna/);
  assert.match(row[7], /Anna/);
  assert.deepEqual(JSON.parse(row[8]), ["Anna", "Anna", "John", "Maria", null, "Anna"]);
  assert.deepEqual(JSON.parse(row[9]), ["Anna", "Anna", "John", "Maria", null, "Anna"]);
  assert.deepEqual(JSON.parse(row[10]), ["Anna", "Anna", "John", "Maria", null, "Anna"]);
  assert.deepEqual(JSON.parse(row[11]), { "1": "Anna", "2": "Anna", "3": "John", "4": "Maria", "5": null, "6": "Anna" });
  assert.equal(row[12], 0);
  assert.equal(row[13], 1);
  assert.equal(row[14], 0);
  assert.equal(row[15], 0);
  assert.equal(row[16], 7);
  assert.equal(row[17], 7);
  assert.ok(row[18] > 0);
  assert.ok(row[19] > 0);
  assert.ok(row[20] > row[19]);
  assert.ok(row[21] > 0);
  assert.ok(row[21] > row[22]);
  assert.ok(row[23] > row[22]);
  assert.equal(row[24], 88);
  assert.equal(row[25], 433);
  assert.equal(row[26], "Anna");
});

test("aggregate builder allows a single aggregate result without GROUP BY and keeps WHERE", () => {
  assert.match(source, /form\.groupBy\.trim\(\) \? splitIdentifiers\(form\.groupBy\) : \[\]/);
  assert.match(source, /const groupByClause = groupColumns\.length \?/);
  assert.match(source, /aggregateSqlExpression\(metric, q\)/);
  assert.match(source, /value="JSON_OBJECTAGG"/);
  assert.match(source, /value="STDDEV_POP"/);
  assert.match(source, /COUNT\(first_name\)/);
  assert.match(source, /FROM Student/);
  assert.match(source, /WHERE first_name = 'Anna'/);
});


test("MySQL STDDEV and VARIANCE aliases use population statistics", async (t) => {
  const database = await createSeededDatabase();
  registerSqlCompatibilityFunctions(database);
  t.after(() => database.close());
  const result = executeSqlBatch(database, "SELECT STDDEV(score) AS deviation, VARIANCE(score) AS variance FROM Student;", "mysql");
  assert.equal(result.ok, true, result.error ?? "MySQL statistical aliases should execute");
  const [deviation, variance] = result.results[0].tables[0].rows[0];
  assert.ok(deviation > 0);
  assert.ok(variance > 0);
  assert.ok(Math.abs(deviation * deviation - variance) < 1e-9);
});
