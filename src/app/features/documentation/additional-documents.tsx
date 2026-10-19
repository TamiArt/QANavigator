import { useState } from "react";
import { DocDateField, DocField, ExportCard } from "./documentation-fields";
import { formatDate } from "./document-format";

export function TestStrategyDocSection() {
  const [product, setProduct] = useState("");
  const [version, setVersion] = useState("");
  const [owner, setOwner] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [goals, setGoals] = useState("");
  const [scope, setScope] = useState("");
  const [levels, setLevels] = useState("Компонентное, интеграционное, системное, приёмочное");
  const [types, setTypes] = useState("Функциональное, регрессионное, smoke, исследовательское");
  const [automation, setAutomation] = useState("");
  const [risks, setRisks] = useState("");
  const [environment, setEnvironment] = useState("");
  const [entryExit, setEntryExit] = useState("");
  const text = [
    "ТЕСТОВАЯ СТРАТЕГИЯ",
    "",
    "Продукт: " + (product || "Не указано"),
    "Версия: " + (version || "Не указано"),
    "Ответственный: " + (owner || "Не указано"),
    "Дата: " + date,
    "",
    "Цели и принципы тестирования",
    goals || "Не указано",
    "",
    "Область тестирования продукта",
    scope || "Не указано",
    "",
    "Уровни тестирования",
    levels || "Не указано",
    "",
    "Виды тестирования",
    types || "Не указано",
    "",
    "Подход к автоматизации",
    automation || "Не указано",
    "",
    "Окружение и инструменты",
    environment || "Не указано",
    "",
    "Риски и способы снижения",
    risks || "Не указано",
    "",
    "Критерии начала и завершения",
    entryExit || "Не указано",
  ].join("\n");
  return <div className="space-y-5">
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-sm text-muted-foreground">Стратегия задаёт общий подход к тестированию продукта в целом. Конкретные сроки и задачи отдельного релиза фиксируются в тест-плане.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DocField label="Продукт" required value={product} onChange={setProduct} placeholder="Название продукта" />
        <DocField label="Версия / продуктовая область" value={version} onChange={setVersion} placeholder="Все версии продукта" />
        <DocField label="Ответственный" value={owner} onChange={setOwner} placeholder="QA Lead" />
        <DocDateField label="Дата" value={date} onChange={setDate} required />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <DocField label="Цели и принципы тестирования" required multiline rows={3} value={goals} onChange={setGoals} placeholder="Качество, надёжность, безопасность, раннее выявление рисков" />
      <DocField label="Область тестирования продукта" required multiline rows={3} value={scope} onChange={setScope} placeholder="Основные модули, интеграции, поддерживаемые платформы" />
      <DocField label="Уровни тестирования" multiline rows={2} value={levels} onChange={setLevels} />
      <DocField label="Виды тестирования" multiline rows={2} value={types} onChange={setTypes} />
      <DocField label="Подход к автоматизации" multiline rows={3} value={automation} onChange={setAutomation} placeholder="Что автоматизируем, приоритеты, критерии выбора" />
      <DocField label="Окружение и инструменты" multiline rows={3} value={environment} onChange={setEnvironment} placeholder="Окружения, браузеры, устройства, инструменты" />
      <DocField label="Риски и способы снижения" multiline rows={3} value={risks} onChange={setRisks} placeholder="Риск — влияние — способ снижения" />
      <DocField label="Критерии начала и завершения" multiline rows={3} value={entryExit} onChange={setEntryExit} placeholder="Условия старта и критерии завершения тестирования продукта" />
    </div>
    <ExportCard text={text} filename="test-strategy.txt" />
  </div>;
}

export function TestDataDocSection() {
  const [product, setProduct] = useState("");
  const [feature, setFeature] = useState("");
  const [owner, setOwner] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [valid, setValid] = useState("");
  const [invalid, setInvalid] = useState("");
  const [boundary, setBoundary] = useState("");
  const [source, setSource] = useState("");
  const [privacy, setPrivacy] = useState("Использовать синтетические или обезличенные данные; не вставлять реальные пароли и персональные данные.");
  const [setup, setSetup] = useState("");
  const [cleanup, setCleanup] = useState("");
  const text = [
    "ТЕСТОВЫЕ ДАННЫЕ",
    "",
    "Продукт: " + (product || "Не указано"),
    "Функция / модуль: " + (feature || "Не указано"),
    "Ответственный: " + (owner || "Не указано"),
    "Дата: " + date,
    "",
    "Валидные данные",
    valid || "Не указано",
    "",
    "Невалидные данные",
    invalid || "Не указано",
    "",
    "Граничные значения",
    boundary || "Не указано",
    "",
    "Источник и подготовка данных",
    source || "Не указано",
    "",
    "Конфиденциальность и обезличивание",
    privacy || "Не указано",
    "",
    "Предусловия и подготовка",
    setup || "Не указано",
    "",
    "Очистка после тестов",
    cleanup || "Не указано",
  ].join("\n");
  return <div className="space-y-5">
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DocField label="Продукт" required value={product} onChange={setProduct} placeholder="Название продукта" />
        <DocField label="Функция / модуль" required value={feature} onChange={setFeature} placeholder="Авторизация, оплата, профиль" />
        <DocField label="Ответственный" value={owner} onChange={setOwner} placeholder="QA Engineer" />
        <DocDateField label="Дата подготовки" value={date} onChange={setDate} required />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <DocField label="Валидные данные" required multiline rows={3} value={valid} onChange={setValid} placeholder="Корректные значения для позитивных сценариев" />
      <DocField label="Невалидные данные" multiline rows={3} value={invalid} onChange={setInvalid} placeholder="Пустые поля, неверный формат, недопустимые значения" />
      <DocField label="Граничные значения" multiline rows={3} value={boundary} onChange={setBoundary} placeholder="Минимум, максимум, значение ниже и выше границы" />
      <DocField label="Источник и подготовка данных" multiline rows={3} value={source} onChange={setSource} placeholder="Тестовые учётные записи, фабрика данных, фикстуры" />
      <DocField label="Конфиденциальность и обезличивание" multiline rows={2} value={privacy} onChange={setPrivacy} />
      <DocField label="Предусловия и подготовка" multiline rows={2} value={setup} onChange={setSetup} placeholder="Какие записи или роли нужно создать заранее" />
      <DocField label="Очистка после тестов" multiline rows={2} value={cleanup} onChange={setCleanup} placeholder="Удаление созданных записей и восстановление исходного состояния" />
    </div>
    <ExportCard text={text} filename="test-data.txt" />
  </div>;
}
