import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => !/\.(?:png|jpe?g|gif|webp|ico|pdf)$/i.test(file));

const conflictMarker = /^(?:<{7}(?:\s|$)|={7}$|>{7}(?:\s|$))/m;
const conflicts = trackedFiles.filter((file) => conflictMarker.test(readFileSync(file, "utf8")));

if (conflicts.length > 0) {
  console.error("Найдены неразрешённые маркеры Git-конфликта:");
  conflicts.forEach((file) => console.error(`- ${file}`));
  console.error("Замените конфликтующий блок целиком итоговой новой реализацией; не сохраняйте оба варианта.");
  process.exit(1);
}

console.log(`Проверено текстовых файлов: ${trackedFiles.length}. Маркеров Git-конфликта нет.`);
