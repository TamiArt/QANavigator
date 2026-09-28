import type { ReactNode } from "react";

export type DocTab = "checklist" | "testcase" | "testplan" | "bugreport" | "testreport" | "rtm";

export interface DocumentTab {
  id: DocTab;
  label: string;
  icon: ReactNode;
}

export const DOCUMENT_TABS: Array<Omit<DocumentTab, "icon"> & { iconName: string }> = [
  { id: "checklist", label: "Чек-лист", iconName: "CheckSquare" },
  { id: "testcase", label: "Тест-кейс", iconName: "FileText" },
  { id: "testplan", label: "Тест-план", iconName: "Clipboard" },
  { id: "bugreport", label: "Баг-репорт", iconName: "Bug" },
  { id: "testreport", label: "Test Report", iconName: "BarChart2" },
  { id: "rtm", label: "RTM", iconName: "Layers" },
];
