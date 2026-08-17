import { Plus, Trash2 } from "lucide-react";
import { FIELD_TYPE_OPTIONS, createEmptyField, type FieldConfig, type TestObjectConfig } from "../types";

interface Props { config: TestObjectConfig; onChange: (config: TestObjectConfig) => void; }
const inputClass = "w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm";
const numberOrUndefined = (value: string) => value === "" ? undefined : Number(value);

function FieldEditor({ field, index, onChange, onRemove, canRemove }: { field: FieldConfig; index: number; onChange: (field: FieldConfig) => void; onRemove: () => void; canRemove: boolean; }) {
  return <div className="space-y-3 rounded-lg border border-border p-3">
    <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">Поле {index + 1}</span>{canRemove && <button type="button" onClick={onRemove} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Удалить поле ${index + 1}`}><Trash2 className="h-4 w-4"/></button>}</div>
    <div className="grid gap-2 sm:grid-cols-2">
      <input aria-label={`Название поля ${index + 1}`} value={field.name} onChange={(event) => onChange({...field, name:event.target.value})} placeholder="Название: Логин" className={inputClass}/>
      <select aria-label={`Тип поля ${index + 1}`} value={field.dataType} onChange={(event) => onChange({...field, dataType:event.target.value as FieldConfig["dataType"]})} className={inputClass}>{FIELD_TYPE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.required} onChange={(event) => onChange({...field, required:event.target.checked})}/>Обязательное поле</label>
    {field.dataType === "number" ? <div className="grid gap-2 sm:grid-cols-2">
      <input type="number" value={field.min ?? ""} onChange={(event) => onChange({...field, min:numberOrUndefined(event.target.value)})} placeholder="min — если известен" className={inputClass}/>
      <input type="number" value={field.max ?? ""} onChange={(event) => onChange({...field, max:numberOrUndefined(event.target.value)})} placeholder="max — если известен" className={inputClass}/>
    </div> : <div className="grid gap-2 sm:grid-cols-2">
      <input type="number" min="0" value={field.minLength ?? ""} onChange={(event) => onChange({...field, minLength:numberOrUndefined(event.target.value)})} placeholder="min длина — если известна" className={inputClass}/>
      <input type="number" min="0" value={field.maxLength ?? ""} onChange={(event) => onChange({...field, maxLength:numberOrUndefined(event.target.value)})} placeholder="max длина — если известна" className={inputClass}/>
    </div>}
    <input value={field.format ?? ""} onChange={(event) => onChange({...field, format:event.target.value || undefined})} placeholder="Например: +7 (999) 999-99-99 · name@example.com · DD.MM.YYYY · AAA-999" className={inputClass}/>
  </div>;
}

export function ObjectCharacteristics({ config, onChange }: Props) {
  const updateField = (index: number, field: FieldConfig) => onChange({...config, fields:config.fields.map((item, current) => current === index ? field : item)});
  const removeField = (index: number) => onChange({...config, fields:config.fields.filter((_, current) => current !== index)});
  const addField = () => onChange({...config, fields:[...config.fields, createEmptyField(config.fields.length)]});
  const showFields = ["field", "form", "auth"].includes(config.objectType);

  return <div className="space-y-4">
    <p className="text-xs text-muted-foreground">Укажи только то, что известно из требований. Пустые ограничения мастер не будет придумывать.</p>

    {showFields && <div className="space-y-3">
      {config.fields.map((field, index) => <FieldEditor key={field.id} field={field} index={index} onChange={(next) => updateField(index, next)} onRemove={() => removeField(index)} canRemove={config.fields.length > 1 && config.objectType !== "field"}/>) }
      {config.objectType !== "field" && <button type="button" onClick={addField} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><Plus className="h-4 w-4"/>Добавить поле</button>}
    </div>}

    {config.objectType === "search" && <div className="grid gap-2 sm:grid-cols-3">
      <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasFilters} onChange={(event) => onChange({...config, hasFilters:event.target.checked})}/>Есть фильтры</label>
      <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasSorting} onChange={(event) => onChange({...config, hasSorting:event.target.checked})}/>Есть сортировка</label>
      <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasPagination} onChange={(event) => onChange({...config, hasPagination:event.target.checked})}/>Есть пагинация</label>
    </div>}

    {config.objectType === "api" && <div className="space-y-3">
      <select value={config.httpMethod ?? "GET"} onChange={(event) => onChange({...config, httpMethod:event.target.value as TestObjectConfig["httpMethod"]})} className={inputClass}><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasParameters} onChange={(event) => onChange({...config, hasParameters:event.target.checked})}/>Есть параметры</label>
        <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasBody} onChange={(event) => onChange({...config, hasBody:event.target.checked})}/>Есть body</label>
        <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={!!config.hasAuthorization} onChange={(event) => onChange({...config, hasAuthorization:event.target.checked})}/>Есть авторизация</label>
      </div>
      <input value={config.requiredApiFields ?? ""} onChange={(event) => onChange({...config, requiredApiFields:event.target.value})} placeholder="Обязательные поля через запятую — если известны" className={inputClass}/>
    </div>}

    {config.objectType === "database" && <textarea value={config.databaseConstraints ?? ""} onChange={(event) => onChange({...config, databaseConstraints:event.target.value})} rows={3} placeholder="Известные ограничения: NOT NULL, UNIQUE, PK/FK, типы, длины..." className={inputClass}/>} 

    {config.objectType === "file-upload" && <div className="space-y-2">
      <input value={config.acceptedFileTypes ?? ""} onChange={(event) => onChange({...config, acceptedFileTypes:event.target.value})} placeholder="Допустимые типы: pdf, jpg — если известны" className={inputClass}/>
      <div className="grid gap-2 sm:grid-cols-2"><input type="number" min="0" value={config.minFileSizeMb ?? ""} onChange={(event) => onChange({...config, minFileSizeMb:numberOrUndefined(event.target.value)})} placeholder="min размер, МБ" className={inputClass}/><input type="number" min="0" value={config.maxFileSizeMb ?? ""} onChange={(event) => onChange({...config, maxFileSizeMb:numberOrUndefined(event.target.value)})} placeholder="max размер, МБ" className={inputClass}/></div>
    </div>}

    {config.objectType === "permissions" && <textarea value={config.roles ?? ""} onChange={(event) => onChange({...config, roles:event.target.value})} rows={3} placeholder="Известные роли и права, например: Админ — редактирует; Гость — только читает" className={inputClass}/>} 
    {config.objectType === "checkout" && <textarea value={config.checkoutRules ?? ""} onChange={(event) => onChange({...config, checkoutRules:event.target.value})} rows={3} placeholder="Известные правила суммы, скидки, доставки, оплаты" className={inputClass}/>} 

    {config.objectType === "stateful" && <div className="space-y-2"><textarea value={config.states ?? ""} onChange={(event) => onChange({...config, states:event.target.value})} rows={2} placeholder="Состояния: Новый, Оплачен, Отменён" className={inputClass}/><textarea value={config.transitions ?? ""} onChange={(event) => onChange({...config, transitions:event.target.value})} rows={3} placeholder="Разрешённые переходы: Новый → Оплачен" className={inputClass}/></div>}

    <div className="space-y-2">
      <p className="text-sm font-medium">Дополнительная логика</p>
      <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={!!config.hasMultipleConditions} onChange={(event) => onChange({...config, hasMultipleConditions:event.target.checked})}/><span><b>Результат зависит от нескольких условий</b><span className="block text-xs text-muted-foreground">Например, скидка зависит от суммы и типа клиента. Добавит Decision Table.</span></span></label>
      <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"><input className="mt-0.5" type="checkbox" checked={!!config.hasManyCombinations} onChange={(event) => onChange({...config, hasManyCombinations:event.target.checked})}/><span><b>Много независимых комбинаций</b><span className="block text-xs text-muted-foreground">Добавит Pairwise, если значения параметров известны.</span></span></label>
    </div>

    <textarea value={config.notes ?? ""} onChange={(event) => onChange({...config, notes:event.target.value})} rows={3} placeholder="Другие известные требования или зависимости" className={inputClass}/>
  </div>;
}
