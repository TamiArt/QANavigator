import { useEffect, useState } from "react";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import {
  deleteTmsAttachment,
  getTmsAttachment,
  listTmsAttachments,
  saveTmsAttachment,
  type TmsAttachmentInfo,
  type TmsAttachmentOwnerType,
} from "./tms-attachments";

interface Props {
  projectId: string;
  ownerType: TmsAttachmentOwnerType;
  ownerId: string;
  attachmentIds?: string[];
  onChange: (ids: string[]) => void;
}
export function TmsAttachmentPanel({ projectId, ownerType, ownerId, attachmentIds = [], onChange }: Props) {
  const [items, setItems] = useState<TmsAttachmentInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = () => listTmsAttachments(projectId, ownerType, ownerId).then((records) => {
    setItems(records);
    onChange(records.map((record) => record.id));
  }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Не удалось прочитать вложения"));
  useEffect(() => {
    let active = true;
    listTmsAttachments(projectId, ownerType, ownerId).then((records) => {
      if (!active) return;
      setItems(records);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Не удалось прочитать вложения");
    });
    return () => { active = false; };
  }, [projectId, ownerType, ownerId]);
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError("");
    try {
      const saved = [];
      for (const file of Array.from(files)) saved.push(await saveTmsAttachment(projectId, ownerType, ownerId, file));
      setItems((current) => [...current, ...saved]);
      onChange([...attachmentIds, ...saved.map((item) => item.id)]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить вложение");
    } finally { setBusy(false); }
  };
  const download = async (id: string) => {
    try {
      const record = await getTmsAttachment(id);
      if (!record) throw new Error("Файл не найден в локальном хранилище");
      const url = URL.createObjectURL(record.blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = record.name; anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось скачать файл"); }
  };
  const remove = async (id: string) => {
    try {
      await deleteTmsAttachment(id);
      const next = items.filter((item) => item.id !== id);
      setItems(next); onChange(next.map((item) => item.id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось удалить вложение"); }
  };
  return <div className="space-y-2 rounded-lg border border-border bg-background/60 p-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><Paperclip className="h-3.5 w-3.5"/> Вложения ({items.length})</span>
      <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"><Upload className="h-3.5 w-3.5"/>{busy ? "Сохранение…" : "Прикрепить файл"}<input type="file" multiple className="sr-only" disabled={busy} onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = ""; }}/></label>
    </div>
    {items.map((item) => <div key={item.id} className="flex items-center gap-2 text-xs"><span className="min-w-0 flex-1 truncate">{item.name} · {(item.size / 1024).toFixed(0)} КБ</span><button type="button" aria-label={"Скачать " + item.name} onClick={() => void download(item.id)}><Download className="h-3.5 w-3.5"/></button><button type="button" aria-label={"Удалить " + item.name} onClick={() => void remove(item.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></button></div>)}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}
