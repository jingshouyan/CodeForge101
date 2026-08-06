import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { createApp, listApps } from '../../api/apps'
import type { App } from '../../api/types'

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setApps(await listApps())
  }, [])

  useEffect(() => {
    load().catch(() => setError('加载失败'))
  }, [load])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createApp({ name, description })
      setName('')
      setDescription('')
      setShowCreate(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">应用管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          新建应用
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <div key={app.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">{app.name}</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {app.owner?.nickname || '—'}
              </span>
            </div>
            <p className="mb-4 min-h-10 text-sm text-gray-500">{app.description || '暂无描述'}</p>
            <div className="flex gap-2 text-sm">
              <Link
                to={`/admin/apps/${app.id}`}
                className="rounded bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200"
              >
                配置页面
              </Link>
              <Link
                to={`/app/${app.id}`}
                className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                访问
              </Link>
            </div>
          </div>
        ))}
        {apps.length === 0 && !loading && (
          <p className="col-span-full text-center text-sm text-gray-400">还没有应用，点击右上角新建</p>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30" onClick={() => setShowCreate(false)}>
          <form
            onSubmit={onCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-96 rounded-lg bg-white p-6 shadow"
          >
            <h2 className="mb-4 font-bold">新建应用</h2>
            <label className="mb-1 block text-sm text-gray-600">名称 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <label className="mb-1 block text-sm text-gray-600">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
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
                disabled={loading}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
