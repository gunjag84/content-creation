import { useState, type ReactNode } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useWizardStore } from '../stores/wizardStore'

interface LayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: any) => void
}

const navItems = [
  { id: 'create', label: 'Create Post', icon: '✦' },
  { id: 'brand', label: 'Brand Config', icon: '◆' },
  { id: 'history', label: 'Post History', icon: '▤' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
]

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [navOpen, setNavOpen] = useState(true)
  const settingsLoading = useSettingsStore(s => s.loading)
  const isGenerating = useWizardStore(s => s.isGenerating)
  const isLoading = settingsLoading || isGenerating

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Global loading bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-blue-100">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '70%' }} />
        </div>
      )}

      {/* Sidebar */}
      <nav
        className={`bg-gray-50 border-r flex flex-col py-4 transition-all duration-200 overflow-hidden flex-shrink-0 ${navOpen ? 'w-52' : 'w-12'}`}
      >
        {/* Header + toggle */}
        <div className={`flex items-center mb-6 px-3 ${navOpen ? 'justify-between' : 'justify-center'}`}>
          {navOpen && <h1 className="text-base font-bold truncate">Content Studio</h1>}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex-shrink-0 text-xs"
            title={navOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {navOpen ? '«' : '»'}
          </button>
        </div>

        {navItems.map((item) => {
          const isActive =
            currentPage === item.id ||
            (currentPage === 'edit' && item.id === 'create') ||
            (currentPage === 'review' && item.id === 'create')
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={!navOpen ? item.label : undefined}
              className={`flex items-center gap-2.5 py-2.5 text-sm text-left transition-colors ${
                navOpen ? 'px-4' : 'px-0 justify-center'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {navOpen && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
