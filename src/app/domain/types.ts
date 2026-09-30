// TYPES
// ══════════════════════════════════════════════════════
import type { QAProject } from "./project";

export type Theme = "light" | "dark";
export type Module =
  | "workspace" | "beginner-wizard" | "requirements" | "test-design" | "test-execution"
  | "automation" | "release-report" | "test-data" | "handbook" | "documentation" | "settings";
export type TestStatus = "pending" | "passed" | "failed" | "blocked";
export type Severity = "critical" | "high" | "medium" | "low";
export type AutoStack =
  | "python-playwright" | "python-selenium" | "python-requests"
  | "ts-playwright" | "ts-cypress" | "js-cypress" | "js-playwright"
  | "java-junit" | "java-testng" | "java-restassured"
  | "kotlin-junit" | "kotlin-espresso"
  | "csharp-nunit" | "csharp-xunit" | "csharp-specflow"
  | "ruby-capybara" | "go-playwright" | "swift-xcuitest" | "php-codeception";

export interface ApiKeys {
  openrouter: string;
  gemini: string;
  provider: "openrouter" | "gemini";
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: "positive" | "negative" | "boundary" | "nonfunctional";
  status: TestStatus;
  testCase?: TestCase;
}

export interface TestCase {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected: string;
  priority: "P1" | "P2" | "P3";
  status: TestStatus;
  source?: string;
}

export interface BugReport {
  id: string;
  title: string;
  environment: string;
  steps: string[];
  actual: string;
  expected: string;
  severity: Severity;
  priority: "P1" | "P2" | "P3";
  createdAt: string;
  testCaseRef?: string;
}

export interface AppCtx {
  activeModule: Module;
  setActiveModule: (m: Module) => void;
  selectedTechnique: string | null;
  setSelectedTechnique: (t: string | null) => void;
  theme: Theme;
  toggleTheme: () => void;
  apiKeys: ApiKeys;
  setApiKeys: (k: ApiKeys) => void;
  projects: QAProject[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  createProject: (project: QAProject) => void;
  updateProject: (id: string, patch: Partial<Omit<QAProject, "id" | "createdAt">>) => void;
  removeProject: (id: string) => void;
  checklists: ChecklistItem[];
  setChecklists: (items: ChecklistItem[]) => void;
  testCases: TestCase[];
  setTestCases: (tcs: TestCase[]) => void;
  bugReports: BugReport[];
  setBugReports: (brs: BugReport[]) => void;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  showApiModal: boolean;
  setShowApiModal: (v: boolean) => void;
  requirementsText: string;
  setRequirementsText: (t: string) => void;
  requirementsResult: string;
  setRequirementsResult: (t: string) => void;
}
