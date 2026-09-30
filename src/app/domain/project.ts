export type ProductType = "web" | "api" | "mobile" | "desktop";

export interface QAProject {
  id: string;
  name: string;
  description: string;
  productType: ProductType;
  environment: string;
  risks: string[];
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  productType: ProductType;
  environment: string;
  risks: string[];
}

export function createProject(input: CreateProjectInput, id: string, createdAt: string): QAProject {
  return {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    productType: input.productType,
    environment: input.environment.trim(),
    risks: input.risks.map((risk) => risk.trim()).filter(Boolean),
    createdAt,
  };
}

export function updateProject(
  projects: QAProject[],
  id: string,
  patch: Partial<Omit<QAProject, "id" | "createdAt">>,
): QAProject[] {
  return projects.map((project) => (project.id === id ? { ...project, ...patch } : project));
}

export function removeProject(projects: QAProject[], id: string): QAProject[] {
  return projects.filter((project) => project.id !== id);
}

export function resolveActiveProjectId(projects: QAProject[], activeProjectId: string): string {
  if (activeProjectId && projects.some((project) => project.id === activeProjectId)) {
    return activeProjectId;
  }
  return projects[0]?.id ?? "";
}
