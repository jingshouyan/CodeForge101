import { Link, Outlet, useNavigate } from 'react-router'
import { useAuthStore } from '../../stores/auth'

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold">CodeForge</span>
          <nav className="flex gap-4 text-sm">
            <Link to="/admin/apps" className="text-gray-600 hover:text-blue-600">
              应用管理
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{user?.nickname || user?.username}</span>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-600">
            退出
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
