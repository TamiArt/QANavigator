import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("all twelve Module 2 lessons use the Module 1 infographic style", () => {
  const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  const lessonSource = fs.readFileSync("src/app/features/handbook/handbook-learning-module2.ts", "utf8");
  const module1Style = fs.readFileSync("src/app/features/handbook/Module1LessonInfographics.tsx", "utf8");
  for (let index = 1; index <= 12; index += 1) {
    const id = "m2-" + String(index).padStart(2, "0");
    assert.ok(lessonSource.includes('id: "' + id + '"'), "Missing lesson " + id);
    assert.ok(renderer.includes('"' + id + '": V('), "Missing visual model for " + id);
  }
  assert.match(renderer, /Module1StyleInfographic visual=\{toModule1StyleVisual/);
  assert.match(module1Style, /export function Module1StyleInfographic/);
  assert.doesNotMatch(renderer, /m2-\d{2}[^\n]*\/infographics\//);
});
