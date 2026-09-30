export type DocTab = "checklist" | "testcase" | "testplan" | "bugreport" | "testreport" | "rtm";

export interface DocumentTab {
  id: DocTab;
  label: string;
  iconName: "CheckSquare" | "FileText" | "Clipboard" | "Bug" | "BarChart2" | "Layers";
}

export const DOCUMENT_TABS: DocumentTab[] = [
  { id: "checklist", label: "Чек-лист", iconName: "CheckSquare" },
  { id: "testcase", label: "Тест-кейс", iconName: "FileText" },
  { id: "testplan", label: "Тест-план", iconName: "Clipboard" },
  { id: "bugreport", label: "Баг-репорт", iconName: "Bug" },
  { id: "testreport", label: "Test Report", iconName: "BarChart2" },
  { id: "rtm", label: "RTM", iconName: "Layers" },
];

export const DOCUMENT_TAB_IDS = DOCUMENT_TABS.map((tab) => tab.id);
