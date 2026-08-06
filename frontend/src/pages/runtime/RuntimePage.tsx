import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getApp } from '../../api/apps'
import { listPages } from '../../api/pages'
import type { App, AppPage } from '../../api/types'
import type { PageSchema } from '../../schema/types'
import { RuntimeRenderer } from '../../runtime/RuntimeRenderer'

export default function RuntimePage() {
  const { appId, path: pathParam } = useParams()
  const [app, setApp] = useState<App | null>(null)
  const [pages, setPages] = useState<AppPage[]>([])
  const [schema, setSchema] = useState<PageSchema | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!appId) return
    ;(async () => {
      try {
        const [appRes, pagesRes] = await Promise.all([getApp(appId), listPages(appId)])
        setApp(appRes)
        setPages(pagesRes)
        const target =
          pagesRes.find((p) => p.path === pathParam) ?? pagesRes.find((p) => p.path !== undefined) ?? null
        if (target) {
          setSchema(JSON.parse(target.schema))
        } else {
          setSchema(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      }
    })()
  }, [appId, pathParam])

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="font-bold">{app?.name ?? '加载中…'}</span>
          <nav className="flex gap-3 text-sm">
            {pages.map((p) => (
              <Link
                key={p.id}
                to={`/app/${appId}/${p.path}`}
                className={
                  pathParam === p.path || (!pathParam && pages[0]?.id === p.id)
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-blue-600'
                }
              >
                {p.name}
              </Link>
            ))}
          </nav>
        </div>
        <Link to="/admin/apps" className="text-sm text-gray-400 hover:text-blue-600">
          管理后台 →
        </Link>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        {schema ? (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <RuntimeRenderer node={schema.root} />
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400">该应用还没有页面</p>
        )}
      </main>
    </div>
  )
}
