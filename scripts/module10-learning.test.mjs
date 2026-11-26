import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("Module 10 is registered after Module 9 with three ordered lessons", () => {
  const registry = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module10.ts", "utf8");
  const expected = [
    "Git: контроль версий, основные понятия и ежедневные команды",
    "GitHub: удалённые репозитории, Pull Request и командная работа",
    "Bash: терминал, навигация по файлам и частые команды для QA",
  ];
  assert.ok(registry.includes('id: "module-10-git-github-bash"'));
  assert.ok(registry.includes('title: "Модуль 10 — Git, GitHub и Bash для QA"'));
  assert.ok(registry.includes("lessons: HANDBOOK_LEARNING_MODULE_10_LESSONS"));
  assert.ok(registry.includes('from "./handbook-learning-module10"'));
  assert.ok(registry.indexOf('id: "module-9-distributed-systems"') < registry.indexOf('id: "module-10-git-github-bash"'));
  assert.equal(source.split('id: "m10-').length - 1, 3);
  const positions = expected.map((title) => {
    const position = source.indexOf('title: ' + JSON.stringify(title));
    assert.notEqual(position, -1, "Missing lesson: " + title);
    return position;
  });
  for (let i = 1; i < positions.length; i += 1) assert.ok(positions[i - 1] < positions[i]);
});

test("Module 10 includes essential Git, GitHub and Bash concepts for QA", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module10.ts", "utf8");
  for (const term of [
    "Working directory", "Staging area", "HEAD", "commit", "branch", "git status",
    "git add", "git diff", "git switch", "git fetch", "git pull", "git push",
    "git restore", "git revert", "git stash", "Merge conflict", "git reset --hard",
    "Pull Request", "Code Review", "GitHub Actions", "Files changed", "CI",
    "pwd", "ls -la", "cd", "mkdir", "touch", "cp", "mv", "rm -rf", "cat",
    "less", "head", "tail -f", "grep", "find", "wc", "sort", "uniq", "diff",
    "stdout", "stderr", "&&", "||", "echo $?", "printenv", "history"
  ]) assert.ok(source.includes(term), "Missing topic or command: " + term);
});

test("Every Module 10 lesson has a dedicated infographic", () => {
  const visuals = fs.readFileSync("src/app/features/handbook/handbook-learning-module10-visuals.ts", "utf8");
  const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  for (let i = 1; i <= 3; i += 1) {
    const id = "m10-0" + i;
    assert.ok(visuals.includes('"' + id + '": V('), "Missing infographic for " + id);
  }
  assert.ok(renderer.includes("...MODULE_10_LESSON_VISUALS"));
});

test("Module 10 lesson template delimiters are balanced", () => {
  const source = fs.readFileSync("src/app/features/handbook/handbook-learning-module10.ts", "utf8");
  let count = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) !== 96) continue;
    let slashes = 0;
    for (let cursor = index - 1; cursor >= 0 && source[cursor] === String.fromCharCode(92); cursor -= 1) slashes += 1;
    if (slashes % 2 === 0) count += 1;
  }
  assert.equal(count, 6, "Three lesson templates must each have one opening and one closing delimiter");
});
