import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { getApp } from '../../api/apps'
import { listPages } from '../../api/pages'
import type { App, AppPage } from '../../api/types'
import type { PageSchema } from '../../schema/types'
import { readDraft } from '../../designer/draft'
import { RuntimeRenderer } from '../../runtime/RuntimeRenderer'

export default function RuntimePage() {
  const { appId, path: pathParam } = useParams()
  const [searchParams] = useSearchParams()
  const isDraftPreview = searchParams.get('draft') === '1'
  const [app, setApp] = useState<App | null>(null)
  const [pages, setPages] = useState<AppPage[]>([])
  const [previewPage, setPreviewPage] = useState<AppPage | null>(null)
  const [schema, setSchema] = useState<PageSchema | null>(null)
  const [usingDraft, setUsingDraft] = useState(false)
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
        setPreviewPage(target)
        if (target) {
          // 设计器草稿预览：?draft=1 且存在未保存草稿时优先渲染，否则回退服务端 schema
          const draft = isDraftPreview ? readDraft(appId, String(target.id)) : null
          setSchema(draft ?? JSON.parse(target.schema))
          setUsingDraft(draft !== null)
        } else {
          setSchema(null)
          setUsingDraft(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      }
    })()
  }, [appId, pathParam, isDraftPreview])

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
      {usingDraft && previewPage && (
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-700">
          <span>草稿预览：包含设计器中未保存的修改</span>
          <Link to={`/admin/apps/${appId}/design/${previewPage.id}`} className="font-medium hover:underline">
            返回设计器
          </Link>
        </div>
      )}
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
