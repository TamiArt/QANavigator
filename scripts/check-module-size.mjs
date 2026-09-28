import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const ROOT = join(process.cwd(), "src");
const MAX_LINES = 1500;
const failures = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const lines = (await readFile(path, "utf8")).split(/\r?\n/).length;
      if (lines > MAX_LINES) failures.push({ path, lines });
    }
  }
}
await walk(ROOT);
if (failures.length) {
  console.error("Module size limit exceeded:");
  for (const failure of failures) console.error(`- ${failure.path}: ${failure.lines} lines`);
  process.exit(1);
}
console.log(`Module size check passed (max ${MAX_LINES} lines).`);
