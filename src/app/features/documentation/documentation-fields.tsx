import type { ChangeEvent } from "react";
import { CopyButton } from "../../components/shared";
import { downloadTextFile } from "../../lib/download";
import { Download } from "lucide-react";

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-xs text-muted-foreground block mb-1">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export function DocField({
  label, required, value, onChange, placeholder, type = "text", multiline, rows = 3,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean; rows?: number;
}) {
  const cls = "w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none";
  return (
    <div>
      <FieldLabel label={label} required={required} />
      {multiline
        ? <textarea value={value} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cls} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

export function DocSelect({
  label, required, value, onChange, options,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function ExportCard({ text, filename }: { text: string; filename: string }) {
  const download = () => downloadTextFile(text, filename, "text/markdown;charset=utf-8");
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Предпросмотр / Экспорт</span>
        <div className="flex items-center gap-2">
          <CopyButton text={text} label="Копировать" />
          <button onClick={download} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Download className="w-3.5 h-3.5" /> .md
          </button>
        </div>
      </div>
      <pre className="px-4 py-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{text}</pre>
    </div>
  );
}
