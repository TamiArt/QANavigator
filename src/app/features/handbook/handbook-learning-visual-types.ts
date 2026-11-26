import type * as React from "react";

export type VisualKind =
  | "flow"
  | "layers"
  | "cycle"
  | "compare"
  | "checklist"
  | "network"
  | "timeline"
  | "pyramid";

export type Accent = "blue" | "lavender" | "mint" | "yellow" | "pink" | "orange";

export type VisualCard = {
  title: string;
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type LessonVisual = {
  kind: VisualKind;
  labels: string[];
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  cards: VisualCard[];
  callout?: string;
};
