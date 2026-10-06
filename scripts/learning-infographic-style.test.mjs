import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("all Learning Mode lesson infographics use the Scrum-style poster shell", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(source, /function ScrumStylePosterDiagram/);
  assert.match(source, /bg-\[#fffdf8\]/);
  assert.match(source, /rounded-\[20px\] border-2 bg-white/);
  assert.match(source, /tracking-\[0\.14em\]/);
  assert.match(source, /Запомнить/);
  assert.match(source, /const palette: Accent\[\]/);
  assert.match(source, /PrincipleIllustration index=\{index\}/);
  assert.match(source, /CardIllustration kind=\{visual\.kind\}/);
});

test("Scrum remains the dedicated visual master while other lessons use shared presentation", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  assert.match(source, /lesson\.id === "m2-04"/);
  assert.match(source, /lesson\.id === "m2-05"/);
  assert.match(source, /m2-04-scrum-context\.svg/);
  assert.match(source, /m2-05-sprint-planning\.svg/);
  assert.match(source, /return <ScrumStylePosterDiagram visual=\{visual\} \/>/);
});
