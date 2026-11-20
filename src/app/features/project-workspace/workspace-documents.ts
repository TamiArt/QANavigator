export interface WorkspaceDocument {
  id: string;
  projectId: string;
  title: string;
  filename: string;
  content: string;
  createdAt: string;
}

export const WORKSPACE_DOCUMENTS_STORAGE_KEY = "qa_navigator_workspace_documents_v1";

export function readWorkspaceDocuments(): WorkspaceDocument[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(WORKSPACE_DOCUMENTS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is WorkspaceDocument =>
      Boolean(item) && typeof item === "object" &&
      typeof item.id === "string" && typeof item.projectId === "string" &&
      typeof item.title === "string" && typeof item.filename === "string" &&
      typeof item.content === "string" && typeof item.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function saveWorkspaceDocument(document: WorkspaceDocument): void {
  const documents = readWorkspaceDocuments();
  localStorage.setItem(WORKSPACE_DOCUMENTS_STORAGE_KEY, JSON.stringify([document, ...documents]));
}

export function removeWorkspaceDocument(id: string): void {
  const documents = readWorkspaceDocuments().filter((document) => document.id !== id);
  localStorage.setItem(WORKSPACE_DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
}
