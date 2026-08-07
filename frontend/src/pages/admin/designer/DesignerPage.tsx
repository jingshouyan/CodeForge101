import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getApp } from '../../../api/apps'
import { getPage, updatePage } from '../../../api/pages'
import type { App, AppPage } from '../../../api/types'
import { useDesignerStore } from '../../../designer/store'
import { Palette } from './Palette'
import { Canvas } from './Canvas'
import { Inspector } from './Inspector'
import { Outline } from './Outline'

export default function DesignerPage() {
  const { appId, pageId } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState<App | null>(null)
  const [page, setPage] = useState<AppPage | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const root = useDesignerStore((s) => s.root)
  const selectedId = useDesignerStore((s) => s.selectedId)
  const load = useDesignerStore((s) => s.load)
  const select = useDesignerStore((s) => s.select)
  const removeNode = useDesignerStore((s) => s.removeNode)
  const undo = useDesignerStore((s) => s.undo)
  const redo = useDesignerStore((s) => s.redo)
  const canUndo = useDesignerStore((s) => s.past.length > 0)
  const canRedo = useDesignerStore((s) => s.future.length > 0)

  useEffect(() => {
    if (!appId || !pageId) return
    ;(async () => {
      try {
        const [appRes, pageRes] = await Promise.all([getApp(appId), getPage(appId, pageId)])
        setApp(appRes)
        setPage(pageRes)
        load(JSON.parse(pageRes.schema))
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      }
    })()
  }, [appId, pageId, load])

  // 快捷键：Delete 删除选中；Ctrl+Z / Ctrl+Shift+Z 撤销/重做（输入框内不触发）
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === 'Delete' && selectedId) {
        e.preventDefault()
        removeNode(selectedId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, removeNode, undo, redo])

  async function onSave() {
    if (!page || !root || saving) return
    setSaving(true)
    setError('')
    try {
      const updated = await updatePage(appId!, page.id, {
        schema: JSON.stringify({ version: '1.0', root }),
        version: page.version,
      })
      setPage(updated)
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (error && !app) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/apps/${appId}`)} className="text-sm text-gray-400 hover:text-blue-600">
            ← 返回
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {app?.name} / {page?.name}
          </span>
          {savedAt && <span className="text-xs text-gray-400">已保存 {new Date(savedAt).toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            撤销
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            重做
          </button>
          {page && (
            <Link
              to={`/app/${appId}/${page.path}`}
              className="rounded border border-blue-200 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
            >
              预览
            </Link>
          )}
          <button
            onClick={onSave}
            disabled={saving || !root}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </header>
      {error && <div className="bg-red-50 px-4 py-1 text-sm text-red-600">{error}</div>}
      <div className="flex flex-1 overflow-hidden">
        <Palette />
        <main className="flex-1 overflow-auto bg-gray-100 p-6" onClick={() => select(null)}>
          <div className="mx-auto min-h-[70vh] max-w-3xl rounded-lg bg-white p-6 shadow-sm">
            {root ? <Canvas /> : <p className="text-sm text-gray-400">加载中…</p>}
          </div>
        </main>
        <aside className="flex w-64 flex-col overflow-auto border-l bg-white">
          <Inspector />
          <Outline />
        </aside>
      </div>
    </div>
  )
}
