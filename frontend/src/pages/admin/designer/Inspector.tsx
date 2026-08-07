import { useState } from 'react'
import { registry, type PropField } from '../../../components/registry'
import { useDesignerStore } from '../../../designer/store'
import { findNode } from '../../../designer/tree'

/** 属性面板：按组件 inspector 定义自动生成表单，高级项折叠 */
export function Inspector() {
  const root = useDesignerStore((s) => s.root)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const updateProp = useDesignerStore((s) => s.updateProp)
  const removeNode = useDesignerStore((s) => s.removeNode)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const node = selectedId && root ? findNode(root, selectedId) : null
  if (!node) {
    return <div className="p-4 text-sm text-gray-400">选中画布中的组件，在此编辑属性</div>
  }
  const def = registry[node.type]
  const basic = def.inspector.filter((f) => !f.advanced)
  const advanced = def.inspector.filter((f) => f.advanced)
  const valueOf = (field: PropField): unknown => {
    const pv = node.props?.[field.prop]
    return pv?.kind === 'literal' ? pv.value : field.default
  }

  return (
    <div className="border-b p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">{def.name}</div>
          <div className="text-xs text-gray-400">{node.id.slice(0, 8)}</div>
        </div>
        <button onClick={() => removeNode(node.id)} className="text-xs text-red-500 hover:underline">
          删除
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {basic.map((field) => (
          <Field key={field.prop} field={field} value={valueOf(field)} onChange={(v) => updateProp(node.id, field.prop, v)} />
        ))}
      </div>
      {advanced.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-gray-400 hover:text-gray-600">
            {showAdvanced ? '收起高级配置' : '展开高级配置'}
          </button>
          {showAdvanced && (
            <div className="mt-2 flex flex-col gap-3">
              {advanced.map((field) => (
                <Field key={field.prop} field={field} value={valueOf(field)} onChange={(v) => updateProp(node.id, field.prop, v)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ field, value, onChange }: { field: PropField; value: unknown; onChange: (v: unknown) => void }) {
  const label = <label className="mb-1 block text-xs text-gray-500">{field.label}</label>
  const inputCls = 'w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none'
  switch (field.control) {
    case 'text':
      return (
        <div>
          {label}
          <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        </div>
      )
    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </div>
      )
    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className={inputCls}
          />
        </div>
      )
    case 'select':
      return (
        <div>
          {label}
          <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )
    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      )
  }
}
