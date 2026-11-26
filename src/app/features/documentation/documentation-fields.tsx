import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { CopyButton } from "../../components/shared";
import { downloadTextFile } from "../../lib/download";
import { Download } from "lucide-react";
import { formatDateInput, toPlainDocumentText, toWordDocumentHtml } from "./document-format";
import { useApp } from "../../core/app-context";
import { saveWorkspaceDocument } from "../project-workspace/workspace-documents";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !multiline) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }, [value, multiline]);
  const cls = "w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none";
  return (
    <div>
      <FieldLabel label={label} required={required} />
      {multiline
        ? <textarea ref={textareaRef} value={value} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)} onInput={e => { e.currentTarget.style.height = "auto"; e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; }} placeholder={placeholder} rows={rows} style={{ overflow: "hidden" }} className={cls} />
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

export function DocDateField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input type="text" inputMode="numeric" placeholder="ДД.ММ.ГГГГ" value={value} onChange={e => onChange(formatDateInput(e.target.value))} maxLength={10} className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
    </div>
  );
}

export function ExportCard({ text, filename }: { text: string; filename: string }) {
  const { projects, activeProjectId } = useApp();
  const [targetProjectId, setTargetProjectId] = useState(activeProjectId);
  const [notice, setNotice] = useState("");
  const baseName = filename.replace(/\.[^.]+$/, "");
  const downloadMarkdown = () => downloadTextFile(text, baseName + ".md", "text/markdown;charset=utf-8");
  const downloadText = () => downloadTextFile(toPlainDocumentText(text), baseName + ".txt", "text/plain;charset=utf-8");
  const downloadDoc = () => downloadTextFile(toWordDocumentHtml(text), baseName + ".doc", "application/msword;charset=utf-8");
  const sendToWorkspace = () => {
    if (!targetProjectId || !text.trim()) return;
    const project = projects.find((item) => item.id === targetProjectId);
    if (!project) return;
    saveWorkspaceDocument({
      id: globalThis.crypto?.randomUUID?.() ?? `doc-${Date.now()}`,
      projectId: targetProjectId,
      title: baseName.replace(/[-_]+/g, " "),
      filename: baseName + ".md",
      content: text,
      createdAt: new Date().toISOString(),
    });
    setNotice(`Документ отправлен в рабочее пространство «${project.name}».`);
  };
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/50 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Предпросмотр / Экспорт</span>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={text} label="Копировать" />
          <button onClick={downloadMarkdown} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"><Download className="w-3.5 h-3.5" /> .md</button>
          <button onClick={downloadText} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">.txt</button>
          <button onClick={downloadDoc} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">.doc</button>
        </div>
      </div>
      <pre className="px-4 py-4 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{text}</pre>
      <div className="border-t border-border p-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground" htmlFor="workspace-document-target">Отправить в рабочее пространство</label>
        <select id="workspace-document-target" value={targetProjectId} onChange={(event) => setTargetProjectId(event.target.value)} disabled={!projects.length} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs">
          {projects.length ? projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>) : <option value="">Сначала создайте рабочее пространство</option>}
        </select>
        <button type="button" onClick={sendToWorkspace} disabled={!projects.length || !targetProjectId} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40">Отправить</button>
        {notice && <p role="status" className="w-full text-xs text-emerald-600 dark:text-emerald-400">{notice}</p>}
      </div>
    </div>
  );
}
