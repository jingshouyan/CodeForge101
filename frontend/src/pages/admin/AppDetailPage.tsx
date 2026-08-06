import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { getApp } from '../../api/apps'
import { createPage, deletePage, listPages, updatePage } from '../../api/pages'
import type { App, AppPage } from '../../api/types'
import { EXAMPLE_SCHEMA } from './exampleSchema'

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

export default function AppDetailPage() {
  const { appId } = useParams()
  const [app, setApp] = useState<App | null>(null)
  const [pages, setPages] = useState<AppPage[]>([])
  const [error, setError] = useState('')

  // 新建页面弹窗
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [schema, setSchema] = useState(EXAMPLE_SCHEMA)

  // 编辑 JSON 弹窗
  const [editing, setEditing] = useState<AppPage | null>(null)
  const [editSchema, setEditSchema] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!appId) return
    const [appRes, pagesRes] = await Promise.all([getApp(appId), listPages(appId)])
    setApp(appRes)
    setPages(pagesRes)
  }, [appId])

  useEffect(() => {
    load().catch(() => setError('加载失败'))
  }, [load])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createPage(appId!, { name, path, schema })
      setShowCreate(false)
      setName('')
      setPath('')
      setSchema(EXAMPLE_SCHEMA)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  async function onEditPage(page: AppPage) {
    setEditing(page)
    setEditSchema(prettyJson(page.schema))
    setError('')
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await updatePage(appId!, editing.id, { schema: editSchema, version: editing.version })
      setEditing(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(page: AppPage) {
    if (!window.confirm(`确认删除页面「${page.name}」？`)) return
    try {
      await deletePage(appId!, page.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  if (!app) return <p className="text-sm text-gray-400">加载中…</p>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/apps" className="text-sm text-gray-400 hover:text-blue-600">
            ← 返回
          </Link>
          <h1 className="text-lg font-bold">{app.name}</h1>
          <span className="text-xs text-gray-400">{app.description}</span>
        </div>
        <Link
          to={`/app/${app.id}`}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          访问运行时
        </Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">页面（{pages.length}）</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          新建页面
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">名称</th>
              <th className="px-4 py-2">路径</th>
              <th className="px-4 py-2">版本</th>
              <th className="px-4 py-2">更新时间</th>
              <th className="px-4 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-gray-500">{p.path}</td>
                <td className="px-4 py-2 text-gray-500">{p.version}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(p.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => onEditPage(p)} className="mr-3 text-blue-600 hover:underline">
                    编辑 JSON
                  </button>
                  <Link to={`/app/${app.id}/${p.path}`} className="mr-3 text-blue-600 hover:underline">
                    预览
                  </Link>
                  <button onClick={() => onDelete(p)} className="text-red-500 hover:underline">
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  还没有页面
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新建页面弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30" onClick={() => setShowCreate(false)}>
          <form
            onSubmit={onCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-[42rem] rounded-lg bg-white p-6 shadow"
          >
            <h2 className="mb-4 font-bold">新建页面</h2>
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm text-gray-600">名称 *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm text-gray-600">路径 *（应用内唯一）</label>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  required
                  placeholder="orders"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <label className="mb-1 block text-sm text-gray-600">Schema（JSON）</label>
            <textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={12}
              spellCheck={false}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 编辑 JSON 弹窗 */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30" onClick={() => setEditing(null)}>
          <form
            onSubmit={onSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-[42rem] rounded-lg bg-white p-6 shadow"
          >
            <h2 className="mb-4 font-bold">编辑页面：{editing.name}</h2>
            <p className="mb-2 text-xs text-gray-400">当前版本 v{editing.version}，保存后自动递增</p>
            <textarea
              value={editSchema}
              onChange={(e) => setEditSchema(e.target.value)}
              rows={16}
              spellCheck={false}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
