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

test("static infographic assets exist and lesson downloads use the original file", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  const assetPaths = [...source.matchAll(/"\/infographics\/([^"]+)"/g)].map((match) => match[1]);
  assert.ok(assetPaths.length > 0, "Expected static infographic assets to be mapped");
  for (const assetPath of assetPaths) {
    assert.ok(fs.existsSync("public/infographics/" + assetPath), "Missing infographic asset: " + assetPath);
  }

  // The module overview belongs at module level, not under the Frontend/Backend lesson.
  assert.doesNotMatch(source, /"m5-01": "\/infographics\/m5-01 infografic po modul\.png"/);
  assert.match(source, /link\.download = decodeURIComponent\(imagePath\.split\("\/"\)\.pop\(\) \|\| "infographic"\)/);
  assert.match(source, /setError\("Не удалось сохранить файл\. Попробуйте ещё раз\."\)/);
});

test("Module 5 static infographic mappings are lesson-specific and preserve intrinsic image ratios", () => {
  const source = fs.readFileSync("src/app/features/handbook/LearningInfographic.tsx", "utf8");
  const mapping = source.slice(source.indexOf("const module5ImagePath"), source.indexOf("const infographicImagePath"));
  for (const [lessonId, filename] of [
    ["m5-02", "m5-02-klient-servernaya arhitectura.jpg"],
    ["m5-03", "m5-03-TCP.jpg"],
    ["m5-04", "m5-04-DNS.jpg"],
    ["m5-05", "m5-05-API i metodi.jpg"],
    ["m5-06", "m5-06-07-08 http i kodi.jpg"],
    ["m5-07", "m5-06-07-08 http i kodi.jpg"],
    ["m5-08", "m5-06-07-08 http i kodi.jpg"],
    ["m5-osi-tcp-ip", "m5-09 oci i tcp ip.jpg"],
    ["m5-09", "m5-10 rest i restful.jpg"],
    ["m5-10", "m5-11-13 swagger i postman.jpg"],
    ["m5-12", "m5-11-13 swagger i postman.jpg"],
  ]) {
    assert.ok(mapping.includes('"' + lessonId + '": "/infographics/' + filename + '"'), "Incorrect or missing image mapping for " + lessonId);
  }
  assert.match(source, /style=\{\{ aspectRatio: module5ImagePath \? "auto"/);
  assert.match(source, /module5ImagePath \? "h-auto" : ""/);
});
