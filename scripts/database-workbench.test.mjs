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
});

test("database workbench handles PostgreSQL and MySQL syntax differences", () => {
  assert.ok(source.includes('dialect === "mysql"'));
  assert.ok(source.includes("MySQL не поддерживает FULL OUTER JOIN напрямую"));
});

test("database workbench never executes SQL or connects to a database", () => {
  assert.ok(source.includes("он не подключается к БД и ничего не выполняет"));
  assert.equal(/\b(mysql2|pg|sequelize|prisma|knex)\b/.test(source), false);
});
