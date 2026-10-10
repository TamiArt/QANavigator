import * as React from "react";
import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

export function CopyButton({ text, label = "Копировать" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Скопировано!" : label}
    </button>
  );
}

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "positive" | "negative" | "boundary" | "nonfunctional" | "passed" | "failed" | "blocked" | "pending" | "beginner" | "intermediate" | "pro" }) {
  const cls: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    boundary: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    nonfunctional: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    blocked: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pending: "bg-muted text-muted-foreground",
    beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    intermediate: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[variant]}`}>
      {children}
    </span>
  );
}

export function Tooltip({ children, tip }: { children: React.ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 bg-foreground text-background text-xs rounded-lg px-2.5 py-2 z-50 shadow-xl pointer-events-none leading-relaxed">
          {tip}
        </span>
      )}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
      AI генерирует...
    </div>
  );
}

export function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-muted-foreground/40 w-12 h-12">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>
    </div>
  );
}

export function CodeBlock({ code, lang = "text" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
        <span className="text-xs text-muted-foreground font-mono">{lang}</span>
        <CopyButton text={code} label="Копировать" />
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-foreground whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

// Simple markdown-ish renderer
export function MarkdownView({ content, compact = false }: { content: string; compact?: boolean }) {
  // AI responses and imported handbook content are untrusted. Escape them before
  // adding the small, controlled set of markup supported by this renderer.
  const normalizedContent = content
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
    .trim();
  const escapedContent = normalizedContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const contentWithTables = escapedContent.replace(
    /(?:^\|.*\|[ \t]*$\n?){2,}/gm,
    (block) => {
      const rows = block
        .trim()
        .split("\n")
        .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
      const columnCount = Math.max(...rows.map((row) => row.length));

      return `<div role="table" class="${compact ? "my-2" : "my-4"} overflow-hidden rounded-xl border border-border bg-card text-sm"><div class="grid bg-muted font-semibold text-foreground" style="grid-template-columns:repeat(${columnCount},minmax(0,1fr))">${rows[0].map((cell) => `<div role="columnheader" class="border-r border-border px-3 py-2 last:border-r-0">${cell}</div>`).join("")}</div>${rows.slice(1).map((row) => `<div role="row" class="grid border-t border-border text-muted-foreground" style="grid-template-columns:repeat(${columnCount},minmax(0,1fr))">${row.map((cell) => `<div role="cell" class="border-r border-border px-3 py-2 last:border-r-0">${cell}</div>`).join("")}</div>`).join("")}</div>`;
    },
  );
  const html = contentWithTables
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold ${compact ? "mt-2 mb-1" : "mt-4 mb-1.5"} text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold ${compact ? "mt-3 mb-1" : "mt-5 mb-2"} text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold ${compact ? "mt-4 mb-1" : "mt-6 mb-2"} text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/gm, '<pre class="bg-muted border border-border rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap">$2</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-3 my-2 text-sm text-muted-foreground italic">$1</blockquote>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm mb-0.5">$2</li>')
    .replace(/^[•\-] (.+)$/gm, '<li class="ml-4 list-disc text-sm mb-0.5">$1</li>')
    .replace(/^✅ (.+)$/gm, '<li class="ml-4 text-sm mb-0.5 text-emerald-600 dark:text-emerald-400 list-none">✅ $1</li>')
    .replace(/^❌ (.+)$/gm, '<li class="ml-4 text-sm mb-0.5 text-red-600 dark:text-red-400 list-none">❌ $1</li>')
    .replace(/^⚠️ (.+)$/gm, '<li class="ml-4 text-sm mb-0.5 text-amber-600 dark:text-amber-400 list-none">⚠️ $1</li>')
    .replace(/\n\n/g, compact ? "<br/>" : "<br/><br/>")
    .replace(/\n/g, '<br/>');
  return (
    <div
      className={`prose prose-sm max-w-none text-foreground ${compact ? "leading-normal" : "leading-relaxed"}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ══════════════════════════════════════════════════════
// API SETTINGS MODAL
// ══════════════════════════════════════════════════════
