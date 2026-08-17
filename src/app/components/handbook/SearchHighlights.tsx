import { Fragment } from "react";

const MARK_CLASS = "rounded bg-amber-300 px-0.5 text-slate-950 dark:bg-amber-400";

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return <>{text}</>;

  const lowerText = text.toLocaleLowerCase("ru");
  const lowerQuery = normalized.toLocaleLowerCase("ru");
  const chunks: { value: string; marked: boolean }[] = [];
  let cursor = 0;
  let match = lowerText.indexOf(lowerQuery);

  while (match !== -1) {
    if (match > cursor) chunks.push({ value: text.slice(cursor, match), marked: false });
    chunks.push({ value: text.slice(match, match + normalized.length), marked: true });
    cursor = match + normalized.length;
    match = lowerText.indexOf(lowerQuery, cursor);
  }
  if (cursor < text.length) chunks.push({ value: text.slice(cursor), marked: false });

  return <>{chunks.map((chunk, index) => (
    <Fragment key={`${index}-${chunk.value}`}>
      {chunk.marked ? <mark className={MARK_CLASS}>{chunk.value}</mark> : chunk.value}
    </Fragment>
  ))}</>;
}

export function SearchMatches({ content, query }: { content: string; query: string }) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return null;

  const plainText = content
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, " "))
    .replace(/[#*`>|[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lowerText = plainText.toLocaleLowerCase("ru");
  const lowerQuery = normalized.toLocaleLowerCase("ru");
  const matches: number[] = [];
  let cursor = lowerText.indexOf(lowerQuery);
  while (cursor !== -1 && matches.length < 3) {
    matches.push(cursor);
    cursor = lowerText.indexOf(lowerQuery, cursor + lowerQuery.length);
  }
  if (!matches.length) return null;

  const snippets = matches.map((position) => {
    const start = Math.max(0, position - 85);
    const end = Math.min(plainText.length, position + normalized.length + 125);
    return `${start ? "…" : ""}${plainText.slice(start, end)}${end < plainText.length ? "…" : ""}`;
  });

  return (
    <div className="mt-2 space-y-1.5" aria-label="Совпадения в тексте темы">
      {snippets.map((snippet, index) => (
        <p key={`${index}-${snippet}`} className="rounded-lg border border-amber-300/50 bg-amber-50/60 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:bg-amber-950/20 dark:text-slate-200">
          <HighlightedText text={snippet} query={normalized} />
        </p>
      ))}
    </div>
  );
}
