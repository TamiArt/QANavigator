import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const renderer = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
const lessonSource = fs.readFileSync("src/app/features/handbook/handbook-learning-module2.ts", "utf8");

const assets = {
  "m2-01": "m2-01-project-stack.svg",
  "m2-02": "m2-02-project-team.svg",
  "m2-03": "m2-03-development-methodologies.svg",
  "m2-06": "m2-06-planning-poker.svg",
  "m2-07": "m2-07-sprint-retrospective.svg",
  "m2-08": "m2-08-scrum-video-guide.svg",
  "m2-09": "m2-09-methodologies-video-guide.svg",
  "m2-10": "m2-10-kanban.svg",
  "m2-11": "m2-11-hybrid-models.svg",
  "m2-12": "m2-12-company-types-topic.svg",
  "m2-04": "m2-04-scrum-context.svg",
  "m2-05": "m2-05-sprint-planning.svg",
};

test("every Module 2 lesson has its own attached infographic asset", () => {
  for (const [id, filename] of Object.entries(assets)) {
    assert.ok(lessonSource.includes('id: "' + id + '"'), "Missing lesson " + id);
    assert.ok(fs.existsSync("public/infographics/" + filename), "Missing infographic " + filename);
    assert.ok(renderer.includes('"' + id + '": "/infographics/' + filename + '"'), "Missing lesson mapping for " + id);
  }
  assert.equal(Object.keys(assets).length, 12);
});

test("new Module 2 posters follow the shared portrait poster style", () => {
  for (const [id, filename] of Object.entries(assets)) {
    const svg = fs.readFileSync("public/infographics/" + filename, "utf8");
    assert.match(svg, /viewBox="0 0 1065 \d+"/, id + " must use the shared portrait canvas");
    assert.match(svg, /<title id="title">/, id + " must have an accessible title");
    assert.match(svg, /КЛЮЧЕВАЯ СХЕМА/, id + " must contain a visual structure");
  }
});

test("Module 2 posters fit their content without a fixed empty lower area", () => {
  for (const [id, filename] of Object.entries(assets)) {
    const svg = fs.readFileSync("public/infographics/" + filename, "utf8");
    assert.match(svg, /QA Navigator/, id + " must keep the small brand signature");
    assert.doesNotMatch(svg, /БАЗА ЗНАНИЙ|РЕЖИМ ОБУЧЕНИЯ|QA NAVIGATOR ·/i, id + " must not include the removed footer labels");
    assert.doesNotMatch(svg, /<text[^>]*>\s*<\/text>/, id + " must not contain empty text blocks");
    if (id !== "m2-04" && id !== "m2-05") {
      assert.doesNotMatch(svg, /viewBox="0 0 1065 1476"/, id + " must size the poster to its content");
      assert.match(svg, /class="brand">QA Navigator<\/text>/, id + " must use the small signature style");
    }
  }
});
