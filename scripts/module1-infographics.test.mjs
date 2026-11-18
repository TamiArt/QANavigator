import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const infographic = fs.readFileSync("src/app/features/handbook/Module1LessonInfographics.tsx", "utf8");
const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
const learning = fs.readFileSync("src/app/features/handbook/handbook-learning.ts", "utf8");

test("Module 1 lessons 2–11 have dedicated source-grounded infographic layouts", () => {
  for (const id of ["m1-02", "m1-03", "m1-04", "m1-05", "m1-06", "m1-07", "m1-08", "m1-09", "m1-10", "m1-11"]) {
    assert.ok(infographic.includes('"' + id + '"'), "Missing infographic for " + id);
  }
  assert.match(renderer, /Module1LessonInfographic lessonId=\{lesson\.id\}/);
  assert.match(infographic, /columns-1 gap-2\.5/);
  assert.match(infographic, /break-inside-avoid/);
});

test("all lesson infographics keep the small QA Navigator signature and shared Module 1 layout", () => {
  assert.match(infographic, />Критерий<\/div>/);
  assert.doesNotMatch(infographic, /<div[^>]*>\s*<\/div>/);
  assert.match(renderer, /Module1StyleInfographic visual=\{toModule1StyleVisual/);
  assert.match(renderer, /text-\[9px\] font-semibold tracking-wide text-slate-400">QA Navigator<\/div>/);
});

