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
export const PROJECTS_STORAGE_KEY = "qa_navigator_projects";
export const ACTIVE_PROJECT_STORAGE_KEY = "qa_navigator_active_project";
