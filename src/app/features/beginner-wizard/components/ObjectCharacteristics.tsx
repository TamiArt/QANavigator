import { Plus, Trash2 } from "lucide-react";
import { FIELD_TYPE_OPTIONS, createEmptyField, type FieldConfig, type TestObjectConfig } from "../types";

interface Props {
  config: TestObjectConfig;
  onChange: (config: TestObjectConfig) => void;
}

const fieldInputClass = "w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm";

function numberOrUndefined(value: string) {
  return value === "" ? undefined : Number(value);
}

function FieldEditor({ field, index, onChange, onRemove, canRemove }: {
  field: FieldConfig;
  index: number;
  onChange: (field: FieldConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return <div className="space-y-3 rounded-lg border border-border p-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium">Поле {index + 1}</span>
      {canRemove && <button type="button" onClick={onRemove} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Удалить поле ${index + 1}`}><Trash2 className="h-4 w-4"/></button>}
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <input aria-label={`Название поля ${index + 1}`} value={field.name} onChange={(event) => onChange({...field, name:event.target.value})} placeholder="Название: Логин" className={fieldInputClass}/>
      <select aria-label={`Тип поля ${index + 1}`} value={field.dataType} onChange={(event) => onChange({...field, dataType:event.target.value as FieldConfig["dataType"]})} className={fieldInputClass}>
        {FIELD_TYPE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.required} onChange={(event) => onChange({...field, required:event.target.checked})}/>Обязательное поле</label>
    {field.dataType === "number" && <div className="grid gap-2 sm:grid-cols-2">
      <input type="number" aria-label={`Минимум ${field.name}`} value={field.min ?? ""} onChange={(event) => onChange({...field, min:numberOrUndefined(event.target.value)})} placeholder="min — если известен" className={fieldInputClass}/>
      <input type="number" aria-label={`Максимум ${field.name}`} value={field.max ?? ""} onChange={(event) => onChange({...field, max:numberOrUndefined(event.target.value)})} placeholder="max — если известен" className={fieldInputClass}/>
    </div>}
    {field.dataType !== "number" && <div className="grid gap-2 sm:grid-cols-2">
      <input type="number" min="0" aria-label={`Минимальная длина ${field.name}`} value={field.minLength ?? ""} onChange={(event) => onChange({...field, minLength:numberOrUndefined(event.target.value)})} placeholder="min длина — если известна" className={fieldInputClass}/>
      <input type="number" min="0" aria-label={`Максимальная длина ${field.name}`} value={field.maxLength ?? ""} onChange={(event) => onChange({...field, maxLength:numberOrUndefined(event.target.value)})} placeholder="max длина — если известна" className={fieldInputClass}/>
    </div>}
    <input aria-label={`Формат ${field.name}`} value={field.format ?? ""} onChange={(event) => onChange({...field, format:event.target.value || undefined})} placeholder="Формат/маска — только если известны" className={fieldInputClass}/>
  </div>;
}

export function ObjectCharacteristics({ config, onChange }: Props) {
  const updateField = (index: number, field: FieldConfig) => onChange({...config, fields:config.fields.map((current, currentIndex) => currentIndex === index ? field : current)});
  const removeField = (index: number) => onChange({...config, fields:config.fields.filter((_, currentIndex) => currentIndex !== index)});
  const addField = () => onChange({...config, fields:[...config.fields, createEmptyField(config.fields.length)]});
  const showFields = ["field", "form", "auth"].includes(config.objectType);

  return <div className="space-y-4">
    {showFields && <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Укажи только известные требования. Пустые ограничения мастер не будет придумывать.</p>
      {config.fields.map((field, index) => <FieldEditor key={field.id} field={field} index={index} onChange={(next) => updateField(index, next)} onRemove={() => removeField(index)} canRemove={config.fields.length > 1 && config.objectType !== "field"}/>) }
      {config.objectType !== "field" && <button type="button" onClick={addField} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Plus className="h-4 w-4"/>Добавить поле</button>}
    </div>}

    {config.objectType === "api" && <div className="space-y-3">
      <label className="block text-sm"><span className="mb-1 block font-medium">HTTP method</span><select value={config.httpMethod ?? "GET"} onChange={(event) => onChange({...config, httpMethod:event.target.value as TestObjectConfig["httpMethod"]})} className={fieldInputClass}><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></label>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasParameters} onChange={(event) => onChange({...config, hasParameters:event.target.checked})}/>Есть параметры</label>
        <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasBody} onChange={(event) => onChange({...config, hasBody:event.target.checked})}/>Есть body</label>
        <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasAuthorization} onChange={(event) => onChange({...config, hasAuthorization:event.target.checked})}/>Есть авторизация</label>
      </div>
      <input value={config.requiredApiFields ?? ""} onChange={(event) => onChange({...config, requiredApiFields:event.target.value})} placeholder="Обязательные поля через запятую — если известны" className={fieldInputClass}/>
    </div>}

    {config.objectType === "stateful" && <div className="space-y-2">
      <textarea value={config.states ?? ""} onChange={(event) => onChange({...config, states:event.target.value})} rows={2} placeholder="Известные состояния, например: Новый, Оплачен, Отменён" className={fieldInputClass}/>
      <textarea value={config.transitions ?? ""} onChange={(event) => onChange({...config, transitions:event.target.value})} rows={3} placeholder="Разрешённые переходы, например: Новый → Оплачен" className={fieldInputClass}/>
    </div>}

    <div className="space-y-2">
      <p className="text-sm font-medium">Есть ли дополнительные условия?</p>
      <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={!!config.hasMultipleConditions} onChange={(event) => onChange({...config, hasMultipleConditions:event.target.checked})}/><span><b>Результат зависит от нескольких условий</b><span className="block text-xs text-muted-foreground">Например, скидка зависит одновременно от суммы и типа клиента. Добавит Decision Table.</span></span></label>
      <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={!!config.hasManyCombinations} onChange={(event) => onChange({...config, hasManyCombinations:event.target.checked})}/><span><b>Много независимых комбинаций параметров</b><span className="block text-xs text-muted-foreground">Добавит Pairwise вместо полного перебора, если наборы значений известны.</span></span></label>
    </div>

    <textarea value={config.notes ?? ""} onChange={(event) => onChange({...config, notes:event.target.value})} rows={3} placeholder="Дополнительные известные требования или зависимости (мастер не будет додумывать их)" className={fieldInputClass}/>
  </div>;
}
