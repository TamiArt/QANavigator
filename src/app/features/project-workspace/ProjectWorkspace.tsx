import { useMemo, useState } from "react";
import { BriefcaseBusiness, Plus, Trash2 } from "lucide-react";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { ACTIVE_PROJECT_STORAGE_KEY, PROJECTS_STORAGE_KEY, type ProductType, type QAProject } from "./types";

const productNames: Record<ProductType, string> = { web: "Web", api: "API", mobile: "Mobile", desktop: "Desktop" };
const blank = { name: "", description: "", productType: "web" as ProductType, environment: "Staging", risks: "" };

export function ProjectWorkspace() {
  const [projects, setProjects] = useLocalStorage<QAProject[]>(PROJECTS_STORAGE_KEY, []);
  const [activeId, setActiveId] = useLocalStorage(ACTIVE_PROJECT_STORAGE_KEY, "");
  const [draft, setDraft] = useState(blank);
  const [showForm, setShowForm] = useState(projects.length === 0);
  const active = useMemo(() => projects.find((project) => project.id === activeId) ?? projects[0], [activeId, projects]);

  const createProject = () => {
    if (!draft.name.trim()) return;
    const project: QAProject = {
      id: crypto.randomUUID(), name: draft.name.trim(), description: draft.description.trim(),
      productType: draft.productType, environment: draft.environment.trim(),
      risks: draft.risks.split("\n").map((risk) => risk.trim()).filter(Boolean), createdAt: new Date().toISOString(),
    };
    setProjects([...projects, project]); setActiveId(project.id); setDraft(blank); setShowForm(false);
  };
  const removeProject = (id: string) => {
    const next = projects.filter((project) => project.id !== id);
    setProjects(next); if (activeId === id) setActiveId(next[0]?.id ?? "");
  };

  return <div className="space-y-4 max-w-5xl">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-xl font-semibold text-foreground">💼 Рабочее пространство</h2><p className="text-sm text-muted-foreground">Контекст продукта, окружение и риски в одном месте.</p></div>
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4"/> Новый проект</button>
    </div>
    {showForm && <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
      <input aria-label="Название проекта" value={draft.name} onChange={(e) => setDraft({...draft, name:e.target.value})} placeholder="Название проекта *" className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm"/>
      <select aria-label="Тип продукта" value={draft.productType} onChange={(e) => setDraft({...draft, productType:e.target.value as ProductType})} className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm">{Object.entries(productNames).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>
      <input aria-label="Окружение" value={draft.environment} onChange={(e) => setDraft({...draft, environment:e.target.value})} placeholder="Окружение" className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm"/>
      <input aria-label="Описание" value={draft.description} onChange={(e) => setDraft({...draft, description:e.target.value})} placeholder="Краткое описание" className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm"/>
      <textarea aria-label="Риски" value={draft.risks} onChange={(e) => setDraft({...draft, risks:e.target.value})} placeholder="Риски — по одному на строку" rows={3} className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm md:col-span-2"/>
      <div className="flex justify-end gap-2 md:col-span-2"><button onClick={()=>setShowForm(false)} className="rounded-lg border border-border px-3 py-2 text-sm">Отмена</button><button disabled={!draft.name.trim()} onClick={createProject} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">Создать</button></div>
    </section>}
    {projects.length > 0 && <div className="grid gap-3 md:grid-cols-[240px_1fr]">
      <aside className="space-y-1 rounded-xl border border-border bg-card p-2">{projects.map((project)=><button key={project.id} onClick={()=>setActiveId(project.id)} className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm ${active?.id===project.id?"bg-primary/10 text-primary":"hover:bg-muted"}`}><BriefcaseBusiness className="h-4 w-4"/><span className="truncate">{project.name}</span></button>)}</aside>
      {active && <section className="rounded-xl border border-border bg-card p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{active.name}</h3><p className="text-xs text-muted-foreground">{productNames[active.productType]} · {active.environment || "Окружение не задано"}</p></div><button aria-label="Удалить проект" onClick={()=>removeProject(active.id)} className="text-destructive"><Trash2 className="h-4 w-4"/></button></div><p className="mt-3 text-sm">{active.description || "Добавьте описание продукта."}</p><h4 className="mt-4 text-sm font-semibold">Ключевые риски</h4>{active.risks.length?<ul className="mt-1 list-disc pl-5 text-sm">{active.risks.map((risk)=><li key={risk}>{risk}</li>)}</ul>:<p className="mt-1 text-sm text-muted-foreground">Риски пока не определены.</p>}<div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-muted p-3">Требования<br/><b>0</b></div><div className="rounded-lg bg-muted p-3">Проверки<br/><b>0</b></div><div className="rounded-lg bg-muted p-3">Дефекты<br/><b>0</b></div></div></section>}
    </div>}
    {!projects.length&&!showForm&&<p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Создайте первый проект, чтобы объединить требования, риски и проверки.</p>}
  </div>;
}
