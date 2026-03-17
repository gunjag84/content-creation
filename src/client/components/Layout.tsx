import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: any) => void
}

const navItems = [
  { id: 'create', label: 'Create Post', icon: '✦' },
  { id: 'brand', label: 'Brand Config', icon: '◆' },
  { id: 'history', label: 'Post History', icon: '▤' }
]

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <nav className="w-56 bg-gray-50 border-r flex flex-col py-4">
        <h1 className="px-4 text-lg font-bold mb-6">Content Studio</h1>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
              currentPage === item.id || (currentPage === 'edit' && item.id === 'create') || (currentPage === 'review' && item.id === 'create')
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
