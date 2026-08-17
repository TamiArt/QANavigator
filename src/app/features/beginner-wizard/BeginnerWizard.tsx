import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocalStorage } from "../../hooks/use-local-storage";
import { PROJECTS_STORAGE_KEY, ACTIVE_PROJECT_STORAGE_KEY, type ProductType, type QAProject } from "../project-workspace/types";
import { ObjectCharacteristics } from "./components/ObjectCharacteristics";
import { PlanStepCard } from "./components/PlanStepCard";
import { buildTestPlan } from "./test-plan-rules";
import { TEST_OBJECT_OPTIONS, createInitialObjectConfig, type TestObjectConfig } from "./types";

const productOptions: { id: ProductType; label: string; hint: string }[] = [
  { id: "web", label: "Web", hint: "Страницы, формы и браузеры" },
  { id: "api", label: "API", hint: "Запросы, ответы и контракты" },
  { id: "mobile", label: "Mobile", hint: "Android/iOS и реальные устройства" },
  { id: "desktop", label: "Desktop", hint: "Windows/macOS/Linux" },
];

const riskSuggestions: Record<ProductType, string[]> = {
  web: ["Пользователь не может выполнить основной сценарий", "Ошибки валидации формы", "Некорректная работа в браузерах"],
  api: ["Нарушен контракт API", "Ошибки авторизации", "Повторный запрос создаёт дубликат"],
  mobile: ["Потеря данных при прерывании", "Сбой на части устройств", "Проблемы при слабой сети"],
  desktop: ["Ошибка установки/обновления", "Потеря локальных данных", "Несовместимость с ОС"],
};

const wizardSteps = ["Контекст", "Продукт", "Объект", "Характеристики", "Риски", "План"];

export function BeginnerWizard() {
  const [projects, setProjects] = useLocalStorage<QAProject[]>(PROJECTS_STORAGE_KEY, []);
  const [, setActiveId] = useLocalStorage(ACTIVE_PROJECT_STORAGE_KEY, "");
  const [wizardStep, setWizardStep] = useState(0);
  const [planIndex, setPlanIndex] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProductType>("web");
  const [goal, setGoal] = useState("");
  const [risks, setRisks] = useState<string[]>([]);
  const [config, setConfig] = useState<TestObjectConfig>(() => createInitialObjectConfig());
  const [done, setDone] = useState(false);
  const plan = useMemo(() => buildTestPlan(config), [config]);
  const safePlanIndex = Math.min(planIndex, Math.max(0, plan.length - 1));
  const currentPlanStep = plan[safePlanIndex];

  const reset = () => {
    setWizardStep(0); setPlanIndex(0); setName(""); setType("web"); setGoal(""); setRisks([]);
    setConfig(createInitialObjectConfig()); setDone(false);
  };

  const finish = () => {
    const project: QAProject = {
      id: crypto.randomUUID(), name: name.trim() || "Мой первый QA-проект", description: goal.trim(),
      productType: type, environment: "Staging", risks, createdAt: new Date().toISOString(),
    };
    setProjects([...projects, project]); setActiveId(project.id); setDone(true);
  };

  const nextWizardStep = () => {
    setWizardStep((value) => Math.min(wizardSteps.length - 1, value + 1));
    setPlanIndex(0);
  };
  const previous = () => {
    if (wizardStep === wizardSteps.length - 1 && safePlanIndex > 0) setPlanIndex((value) => Math.max(0, value - 1));
    else setWizardStep((value) => Math.max(0, value - 1));
  };

  if (done) return <div className="mx-auto max-w-xl rounded-xl border border-emerald-500/30 bg-card p-6 text-center">
    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500"/>
    <h2 className="mt-3 text-xl font-semibold">Проект готов</h2>
    <p className="mt-2 text-sm text-muted-foreground">Проект сохранён. Маршрут остаётся доступен, чтобы вернуться к проверкам, Retest и Regression.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <button onClick={() => { setDone(false); setWizardStep(wizardSteps.length - 1); setPlanIndex(Math.max(0, plan.length - 1)); }} className="rounded-lg border border-border px-3 py-2 text-sm">Вернуться к плану</button>
      <button onClick={reset} className="rounded-lg border border-border px-3 py-2 text-sm">Создать ещё один</button>
    </div>
  </div>;

  return <div className="mx-auto max-w-2xl space-y-4">
    <div><h2 className="text-xl font-semibold">🧭 Мастер для новичка</h2><p className="text-sm text-muted-foreground">Опиши объект и известные требования — мастер без AI подберёт релевантные проверки и техники.</p></div>
    <div className="flex gap-1" aria-label={`Этап ${wizardStep + 1} из ${wizardSteps.length}`}>{wizardSteps.map((label, index) => <div key={label} title={label} className={`h-1.5 flex-1 rounded ${index <= wizardStep ? "bg-primary" : "bg-muted"}`}/>)}</div>

    <section className="rounded-xl border border-border bg-card p-5">
      {wizardStep === 0 && <div className="space-y-3">
        <div><p className="text-xs text-muted-foreground">Этап 1 из {wizardSteps.length}</p><h3 className="font-semibold">Что ты тестируешь?</h3></div>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Например: регистрация интернет-магазина" className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm"/>
        <textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Главная цель пользователя и продукта" rows={3} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm"/>
      </div>}

      {wizardStep === 1 && <div>
        <div className="mb-3"><p className="text-xs text-muted-foreground">Этап 2 из {wizardSteps.length}</p><h3 className="font-semibold">Выбери тип продукта</h3></div>
        <div className="grid grid-cols-2 gap-2">{productOptions.map((option) => <button key={option.id} onClick={() => setType(option.id)} className={`rounded-lg border p-3 text-left ${type === option.id ? "border-primary bg-primary/10" : "border-border"}`}><b className="text-sm">{option.label}</b><span className="block text-xs text-muted-foreground">{option.hint}</span></button>)}</div>
      </div>}

      {wizardStep === 2 && <div>
        <div className="mb-3"><p className="text-xs text-muted-foreground">Этап 3 из {wizardSteps.length}</p><h3 className="font-semibold">Что конкретно нужно проверить?</h3><p className="text-xs text-muted-foreground">Это объект текущего тестирования, а не тип всего проекта.</p></div>
        <div className="grid gap-2 sm:grid-cols-2">{TEST_OBJECT_OPTIONS.map((option) => <button key={option.id} onClick={() => { setConfig({...config, objectType:option.id}); setPlanIndex(0); }} className={`rounded-lg border p-3 text-left ${config.objectType === option.id ? "border-primary bg-primary/10" : "border-border"}`}><b className="text-sm">{option.label}</b><span className="block text-xs text-muted-foreground">{option.hint}</span></button>)}</div>
      </div>}

      {wizardStep === 3 && <div>
        <div className="mb-3"><p className="text-xs text-muted-foreground">Этап 4 из {wizardSteps.length}</p><h3 className="font-semibold">Уточни известные характеристики</h3></div>
        <ObjectCharacteristics config={config} onChange={(next) => { setConfig(next); setPlanIndex(0); }}/>
      </div>}

      {wizardStep === 4 && <div>
        <div className="mb-3"><p className="text-xs text-muted-foreground">Этап 5 из {wizardSteps.length}</p><h3 className="font-semibold">Какие риски особенно важны?</h3><p className="text-xs text-muted-foreground">Необязательно. Они сохранятся в рабочем контексте проекта.</p></div>
        <div className="space-y-2">{riskSuggestions[type].map((risk) => <label key={risk} className="flex gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={risks.includes(risk)} onChange={() => setRisks(risks.includes(risk) ? risks.filter((item) => item !== risk) : [...risks, risk])}/>{risk}</label>)}</div>
      </div>}

      {wizardStep === 5 && currentPlanStep && <div>
        <div className="mb-4"><p className="text-xs text-muted-foreground">Этап 6 из {wizardSteps.length} · персональный маршрут</p><h3 className="font-semibold">Что делать сейчас</h3></div>
        <PlanStepCard key={currentPlanStep.id} step={currentPlanStep} index={safePlanIndex} total={plan.length}/>
      </div>}

      <div className="mt-5 flex justify-between gap-3">
        <button disabled={wizardStep === 0 && safePlanIndex === 0} onClick={previous} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-30"><ArrowLeft className="h-4 w-4"/>Назад</button>
        {wizardStep < wizardSteps.length - 1 && <button onClick={nextWizardStep} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Далее<ArrowRight className="h-4 w-4"/></button>}
        {wizardStep === wizardSteps.length - 1 && safePlanIndex < plan.length - 1 && <button onClick={() => setPlanIndex((value) => Math.min(plan.length - 1, value + 1))} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Выполнено, дальше<ArrowRight className="h-4 w-4"/></button>}
        {wizardStep === wizardSteps.length - 1 && safePlanIndex === plan.length - 1 && <button onClick={finish} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Завершить и создать проект</button>}
      </div>
    </section>
  </div>;
}
