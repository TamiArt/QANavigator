import { downloadTextFile } from "../../lib/download";

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return day + "." + month + "." + date.getFullYear();
}

export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "." + digits.slice(2);
  return digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4);
}

export function toPlainDocumentText(markdown: string): string {
  return markdown.split(/\r?\n/).map((rawLine) => {
    let line = rawLine.trim();
    if (!line || /^[-*_]{3,}$/.test(line)) return "";
    if (/^\|?\s*:?-{3,}/.test(line) && line.includes("|")) return "";
    line = line.replace(/^#{1,6}\s+/, "");
    line = line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/__(.*?)__/g, "$1");
    line = line.replace(/~~(.*?)~~/g, "$1").replace(/`([^`]+)`/g, "$1");
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
    line = line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, "");
    if (line.startsWith("|") || line.endsWith("|")) {
      line = line.replace(/^\|\s*/, "").replace(/\s*\|$/, "").split("|").map((cell) => cell.trim()).filter(Boolean).join(" — ");
    }
    line = line.replace(/\*+/g, "").replace(/^\s*[-+]\s+/, "");
    return line;
  }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function toWordDocumentHtml(markdown: string): string {
  const paragraphs = markdown.split(/\r?\n/).map((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed || /^[-*_]{3,}$/.test(trimmed) || (/^\|?\s*:?-{3,}/.test(trimmed) && trimmed.includes("|"))) return "";
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    const text = escapeHtml(toPlainDocumentText(trimmed));
    if (!text) return "";
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      return "<h" + level + ">" + text + "</h" + level + ">";
    }
    return "<p>" + text + "</p>";
  }).filter(Boolean).join("\n");
  return '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.45}h1,h2,h3{color:#203864}p{margin:0 0 8pt}</style></head><body>' + paragraphs + "</body></html>";
}

export function downloadPlainText(markdown: string, filename: string): void {
  downloadTextFile(toPlainDocumentText(markdown), filename, "text/plain;charset=utf-8");
}

export function downloadWordDocument(markdown: string, filename: string): void {
  downloadTextFile(toWordDocumentHtml(markdown), filename, "application/msword;charset=utf-8");
}
