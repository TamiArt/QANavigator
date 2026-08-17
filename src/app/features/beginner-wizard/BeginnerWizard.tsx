import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { PROJECTS_STORAGE_KEY, ACTIVE_PROJECT_STORAGE_KEY, type ProductType, type QAProject } from "../project-workspace/types";
import { ObjectCharacteristics } from "./components/ObjectCharacteristics";
import { TestPlanOverview } from "./components/TestPlanOverview";
import { buildTestPlan } from "./test-plan-rules";
import { TEST_OBJECT_OPTIONS, createInitialObjectConfig, type TestObjectConfig } from "./types";

const productOptions: { id: ProductType; label: string; hint: string }[] = [
  { id: "web", label: "Web", hint: "Страницы, формы и браузеры" },
  { id: "api", label: "API", hint: "Запросы, ответы и контракты" },
  { id: "mobile", label: "Mobile", hint: "Android/iOS и реальные устройства" },
  { id: "desktop", label: "Desktop", hint: "Windows/macOS/Linux" },
];

const wizardSteps = ["Продукт", "Объект", "Характеристики", "План"];

export function BeginnerWizard() {
  const [projects, setProjects] = useLocalStorage<QAProject[]>(PROJECTS_STORAGE_KEY, []);
  const [, setActiveId] = useLocalStorage(ACTIVE_PROJECT_STORAGE_KEY, "");
  const [wizardStep, setWizardStep] = useState(0);
  const [type, setType] = useState<ProductType>("web");
  const [config, setConfig] = useState<TestObjectConfig>(() => createInitialObjectConfig());
  const [done, setDone] = useState(false);

  const plan = useMemo(() => {
    const generated = buildTestPlan(config);
    if (config.objectType !== "form" && config.objectType !== "auth") return generated;
    return generated.filter((item) => !item.id.includes("-positive") || item.id === "form-happy");
  }, [config]);

  const reset = () => {
    setWizardStep(0);
    setType("web");
    setConfig(createInitialObjectConfig());
    setDone(false);
  };

  const finish = () => {
    const objectLabel = TEST_OBJECT_OPTIONS.find((option) => option.id === config.objectType)?.label ?? "QA-проверка";
    const project: QAProject = {
      id: crypto.randomUUID(),
      name: objectLabel,
      description: "",
      productType: type,
      environment: "Staging",
      risks: [],
      createdAt: new Date().toISOString(),
    };
    setProjects([...projects, project]);
    setActiveId(project.id);
    setDone(true);
  };

  if (done) return <div className="mx-auto max-w-xl rounded-xl border border-emerald-500/30 bg-card p-6 text-center">
    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500"/>
    <h2 className="mt-3 text-xl font-semibold">План готов</h2>
    <p className="mt-2 text-sm text-muted-foreground">Рабочий контекст сохранён. Можно вернуться к плану или начать новый.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <button onClick={() => { setDone(false); setWizardStep(wizardSteps.length - 1); }} className="rounded-lg border border-border px-3 py-2 text-sm">Вернуться к плану</button>
      <button onClick={reset} className="rounded-lg border border-border px-3 py-2 text-sm">Новый план</button>
    </div>
  </div>;

  return <div className="mx-auto max-w-3xl space-y-4">
    <div>
      <h2 className="text-xl font-semibold">🧭 Мастер для новичка</h2>
      <p className="text-sm text-muted-foreground">Укажи объект и известные требования — мастер без AI составит понятный план проверок.</p>
    </div>

    <div className="flex gap-1" aria-label={`Этап ${wizardStep + 1} из ${wizardSteps.length}`}>
      {wizardSteps.map((label, index) => <div key={label} title={label} className={`h-1.5 flex-1 rounded ${index <= wizardStep ? "bg-primary" : "bg-muted"}`}/>) }
    </div>

    <section className="rounded-xl border border-border bg-card p-5">
      {wizardStep === 0 && <div>
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Этап 1 из {wizardSteps.length}</p>
          <h3 className="font-semibold">Выбери тип продукта</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">{productOptions.map((option) => <button key={option.id} onClick={() => setType(option.id)} className={`rounded-lg border p-3 text-left ${type === option.id ? "border-primary bg-primary/10" : "border-border"}`}><b className="text-sm">{option.label}</b><span className="block text-xs text-muted-foreground">{option.hint}</span></button>)}</div>
      </div>}

      {wizardStep === 1 && <div>
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Этап 2 из {wizardSteps.length}</p>
          <h3 className="font-semibold">Что конкретно нужно проверить?</h3>
          <p className="text-xs text-muted-foreground">Выбери объект текущего тестирования.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">{TEST_OBJECT_OPTIONS.map((option) => <button key={option.id} onClick={() => setConfig({...config, objectType:option.id})} className={`rounded-lg border p-3 text-left ${config.objectType === option.id ? "border-primary bg-primary/10" : "border-border"}`}><b className="text-sm">{option.label}</b><span className="block text-xs text-muted-foreground">{option.hint}</span></button>)}</div>
      </div>}

      {wizardStep === 2 && <div>
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Этап 3 из {wizardSteps.length}</p>
          <h3 className="font-semibold">Уточни известные характеристики</h3>
        </div>
        <ObjectCharacteristics config={config} onChange={setConfig}/>
      </div>}

      {wizardStep === 3 && <div>
        <div className="mb-4">
          <p className="text-xs text-muted-foreground">Этап 4 из {wizardSteps.length}</p>
          <h3 className="font-semibold">Что проверять</h3>
          <p className="text-xs text-muted-foreground">Готовый план без режима «24 шага». Все необходимые проверки собраны по смысловым разделам.</p>
        </div>
        <TestPlanOverview steps={plan}/>
      </div>}

      <div className="mt-5 flex justify-between gap-3">
        <button disabled={wizardStep === 0} onClick={() => setWizardStep((value) => Math.max(0, value - 1))} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-30"><ArrowLeft className="h-4 w-4"/>Назад</button>
        {wizardStep < wizardSteps.length - 1
          ? <button onClick={() => setWizardStep((value) => Math.min(wizardSteps.length - 1, value + 1))} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Далее<ArrowRight className="h-4 w-4"/></button>
          : <button onClick={finish} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Сохранить план</button>}
      </div>
    </section>
  </div>;
}
