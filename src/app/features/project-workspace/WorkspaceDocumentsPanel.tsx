import { useEffect, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import { downloadTextFile } from "../../lib/download";
import { readWorkspaceDocuments, removeWorkspaceDocument, type WorkspaceDocument } from "./workspace-documents";

export function WorkspaceDocumentsPanel({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const refresh = () => setDocuments(readWorkspaceDocuments().filter((item) => item.projectId === projectId));

  useEffect(() => {
    refresh();
  }, [projectId]);

  const remove = (id: string) => {
    removeWorkspaceDocument(id);
    refresh();
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Документы рабочего пространства</h3>
          <p className="text-xs text-muted-foreground mt-1">Документы, отправленные сюда из раздела «Тестовая документация».</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs">{documents.length}</span>
      </div>
      {documents.length ? (
        <div className="divide-y divide-border">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{document.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(document.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => downloadTextFile(document.content, document.filename, "text/markdown;charset=utf-8")} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                <Download className="h-3.5 w-3.5" /> Скачать
              </button>
              <button type="button" aria-label="Удалить документ" onClick={() => remove(document.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-5 text-center text-xs text-muted-foreground">Пока нет документов. Отправьте сюда документ из раздела «Тестовая документация».</p>
      )}
    </section>
  );
}
