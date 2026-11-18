import { createProject, resolveActiveProjectId, type QAProject } from "./project";

export interface ProjectScopedRecord {
  id: string;
  projectId?: string;
}

export interface ProjectCollections<T extends ProjectScopedRecord> {
  projects: QAProject[];
  activeProjectId: string;
  checklists: T[];
  testCases: T[];
  bugReports: T[];
}

export interface ProjectCollectionsMigration<T extends ProjectScopedRecord> extends ProjectCollections<T> {
  changed: boolean;
  migratedProjectId: string;
}

function hasUnassignedRecords<T extends ProjectScopedRecord>(records: T[]): boolean {
  return records.some((record) => !record.projectId);
}

/**
 * Assigns pre-workspace records to the active project without changing their IDs.
 * If old data exists but no project does, creates a recovery project so that the
 * first project-scoping migration never strands existing user data.
 */
export function migrateProjectCollections<T extends ProjectScopedRecord>(
  input: ProjectCollections<T>,
  legacyProjectId: string,
  createdAt: string,
): ProjectCollectionsMigration<T> {
  const hasLegacyData =
    hasUnassignedRecords(input.checklists) ||
    hasUnassignedRecords(input.testCases) ||
    hasUnassignedRecords(input.bugReports);

  let projects = input.projects;
  let activeProjectId = resolveActiveProjectId(projects, input.activeProjectId);

  if (projects.length === 0 && hasLegacyData) {
    const recoveryProject = createProject(
      {
        name: "Импортированные данные",
        description: "Проект создан автоматически для сохранения данных из предыдущей версии QA Navigator.",
        productType: "web",
        environment: "Не указано",
        risks: [],
      },
      legacyProjectId,
      createdAt,
    );
    projects = [recoveryProject];
    activeProjectId = recoveryProject.id;
  }

  const assignProject = (records: T[]): T[] => {
    if (!activeProjectId) return records;
    return records.map((record) =>
      record.projectId ? record : { ...record, projectId: activeProjectId },
    );
  };

  const checklists = assignProject(input.checklists);
  const testCases = assignProject(input.testCases);
  const bugReports = assignProject(input.bugReports);
  const changed =
    projects !== input.projects ||
    activeProjectId !== input.activeProjectId ||
    checklists.some((record, index) => record !== input.checklists[index]) ||
    testCases.some((record, index) => record !== input.testCases[index]) ||
    bugReports.some((record, index) => record !== input.bugReports[index]);

  return {
    projects,
    activeProjectId,
    checklists,
    testCases,
    bugReports,
    changed,
    migratedProjectId: activeProjectId,
  };
}

export function selectProjectRecords<T extends ProjectScopedRecord>(
  records: T[],
  projectId: string,
): T[] {
  return records.filter((record) => record.projectId === projectId);
}

/** Replace one project's collection while preserving every other project's data. */
export function replaceProjectRecords<T extends ProjectScopedRecord>(
  records: T[],
  projectId: string,
  nextRecords: T[],
): T[] {
  const retained = records.filter((record) => record.projectId !== projectId);
  const scoped = nextRecords.map((record) => ({ ...record, projectId }));
  return [...retained, ...scoped];
}
