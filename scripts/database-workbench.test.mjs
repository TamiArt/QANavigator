import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildNestedScalarSubquery, buildCorrelatedExistsSubquery } from "../src/app/features/database-workbench/nested-subquery-builder.mjs";
import { buildAdvancedSelect } from "../src/app/features/database-workbench/advanced-select-builder.mjs";

const source = await readFile("src/app/features/database-workbench/DatabaseWorkbenchModule.tsx", "utf8");
const nestedBuilderSource = await readFile("src/app/features/database-workbench/nested-subquery-builder.mjs", "utf8");

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
  assert.ok(source.includes('type Operation = "advancedSelect" |'));
  assert.ok(source.includes('case "advancedSelect":'));
  assert.ok(source.includes('value="advancedSelect"'));
  assert.ok(source.includes("form.advancedSelectItems"));
  assert.ok(source.includes("form.advancedJoins"));
  assert.ok(source.includes("form.advancedGroupBy"));
  assert.ok(source.includes("form.advancedHaving"));
  assert.ok(source.includes("form.advancedOrderBy"));
  assert.ok(source.includes('operation === "select" || operation === "advancedSelect" || operation === "aggregate"'));
});
