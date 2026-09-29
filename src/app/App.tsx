import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart2, BookOpen, Brain, CheckSquare, Clipboard, Database, FileText,
  GraduationCap, Key, Menu, Moon, Play, Settings, Shield, Sun, Terminal,
} from "lucide-react";
import { ProjectWorkspace } from "./features/project-workspace/ProjectWorkspace";
import { BeginnerWizard } from "./features/beginner-wizard/BeginnerWizard";
import { RequirementsModule } from "./features/requirements/RequirementsModule";
import { TestDesignModule } from "./features/test-design/TestDesignModule";
import { TestExecutionModule } from "./features/test-execution/TestExecutionModule";
import { AutomationModule } from "./features/automation/AutomationModule";
import { ReleaseReportModule } from "./features/release-report/ReleaseReportModule";
import { TestDataModule } from "./features/test-data/TestDataModule";
import { HandbookModule } from "./features/handbook/HandbookModule";
import { DocumentationModule } from "./features/documentation/DocumentationModule";
import { SettingsModule } from "./features/settings/SettingsModule";
import { ApiModal } from "./components/ApiModal";
import { Tooltip } from "./components/shared";
import { AppContext } from "./core/app-context";
import { STORAGE_KEYS } from "./core/constants";
import { useLocalStorage } from "./hooks/use-local-storage";
import type {
  ApiKeys, BugReport, ChecklistItem, Module, TestCase, Theme,
} from "./domain/types";

const NAV_ICONS: Record<Module, ReactNode> = {
  workspace: <Clipboard className="w-4 h-4" />,
  "beginner-wizard": <GraduationCap className="w-4 h-4" />,
  requirements: <Brain className="w-4 h-4" />,
  "test-design": <CheckSquare className="w-4 h-4" />,
  "test-execution": <Play className="w-4 h-4" />,
  automation: <Terminal className="w-4 h-4" />,
  "release-report": <BarChart2 className="w-4 h-4" />,
  "test-data": <Database className="w-4 h-4" />,
  handbook: <BookOpen className="w-4 h-4" />,
  documentation: <FileText className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
};
const NAV_ITEMS = APP_NAVIGATION.map((item) => ({ ...item, icon: NAV_ICONS[item.id] }));

export default function App() {
  const [theme, setTheme] = useLocalStorage<Theme>(STORAGE_KEYS.theme, "dark");
  const [activeModule, setActiveModule] = useState<Module>("requirements");
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>(STORAGE_KEYS.apiKeys, {
    openrouter: "", gemini: "", provider: "openrouter",
  });
  const [checklists, setChecklists] = useLocalStorage<ChecklistItem[]>(STORAGE_KEYS.checklists, []);
  const [testCases, setTestCases] = useLocalStorage<TestCase[]>(STORAGE_KEYS.testCases, []);
  const [bugReports, setBugReports] = useLocalStorage<BugReport[]>(STORAGE_KEYS.bugReports, []);
  const [bookmarks, setBookmarks] = useLocalStorage<string[]>(STORAGE_KEYS.bookmarks, []);
  const [showApiModal, setShowApiModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requirementsText, setRequirementsText] = useLocalStorage<string>(STORAGE_KEYS.requirementsText, "");
  const [requirementsResult, setRequirementsResult] = useLocalStorage<string>(STORAGE_KEYS.requirementsResult, "");

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(bookmarks.includes(id) ? bookmarks.filter((b) => b !== id) : [...bookmarks, id]);
  }, [bookmarks, setBookmarks]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const hasApiKey = Boolean(apiKeys[apiKeys.provider]);

  const ctx = {
    activeModule, setActiveModule, selectedTechnique, setSelectedTechnique,
    theme, toggleTheme, apiKeys, setApiKeys, checklists, setChecklists,
    testCases, setTestCases, bugReports, setBugReports, bookmarks, toggleBookmark,
    showApiModal, setShowApiModal, requirementsText, setRequirementsText,
    requirementsResult, setRequirementsResult,
  };

  const renderModule = () => {
    switch (activeModule) {
      case "workspace": return <ProjectWorkspace />;
      case "beginner-wizard": return <BeginnerWizard />;
      case "requirements": return <RequirementsModule />;
      case "test-design": return <TestDesignModule />;
      case "test-execution": return <TestExecutionModule />;
      case "automation": return <AutomationModule />;
      case "release-report": return <ReleaseReportModule />;
      case "test-data": return <TestDataModule />;
      case "handbook": return <HandbookModule />;
      case "documentation": return <DocumentationModule />;
      case "settings": return <SettingsModule />;
    }
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-['Inter',_sans-serif]">
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative z-30 lg:z-auto flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-full ${sidebarOpen ? "w-64" : "w-0 lg:w-64"} overflow-hidden shrink-0`}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-primary-foreground" /></div>
            <div className="min-w-0"><p className="font-bold text-sidebar-foreground text-sm leading-tight">QA Navigator</p><p className="text-[10px] text-muted-foreground font-mono">v1.0 · 2026</p></div>
          </div>
          <div className="px-4 py-3 border-b border-sidebar-border">
            <button onClick={() => setShowApiModal(true)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${hasApiKey ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
              <span className="flex-1 text-left">{hasApiKey ? "AI подключён" : "Настроить AI ключ"}</span>
              <Key className="w-3 h-3" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveModule(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeModule === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
                {item.icon}
                <span className="truncate">{item.label}</span>
                {item.id === "test-execution" && checklists.some((c) => c.status === "failed") && <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-mono">{checklists.filter((c) => c.status === "failed").length}</span>}
                {item.id === "handbook" && bookmarks.length > 0 && <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-mono">{bookmarks.length}</span>}
              </button>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-sidebar-border">
            <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card shrink-0">
            <button aria-label="Открыть меню" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Menu className="w-5 h-5" /></button>
            <div className="flex-1 min-w-0"><h1 className="font-semibold text-base text-foreground truncate">{NAV_ITEMS.find((n) => n.id === activeModule)?.label}</h1></div>
            <div className="flex items-center gap-2">
              {!hasApiKey && <Tooltip tip="Настройте API ключ для использования AI функций"><button onClick={() => setShowApiModal(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"><span className="hidden sm:inline">Настроить AI</span></button></Tooltip>}
              <button aria-label="Переключить тему" onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{renderModule()}</div></main>
        </div>
      </div>
      <ApiModal open={showApiModal} onClose={() => setShowApiModal(false)} />
    </AppContext.Provider>
  );
}
