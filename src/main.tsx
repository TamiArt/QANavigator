import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";

const App = lazy(() => import("./app/App.tsx"));

function StartupFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">QA Navigator</p>
          <p className="text-xs text-muted-foreground">Загрузка рабочего пространства…</p>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<StartupFallback />}>
    <App />
  </Suspense>,
);
