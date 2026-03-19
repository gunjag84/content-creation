import { useState, type ReactNode } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useWizardStore } from '../stores/wizardStore'

interface LayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: any) => void
}

interface NavItem {
  id: string
  label: string
  icon: string
  children?: { id: string; label: string }[]
}

const navItems: NavItem[] = [
  { id: 'create', label: 'Create Post', icon: '✦' },
  {
    id: 'brand',
    label: 'Settings',
    icon: '⚙',
    children: [
      { id: 'brand-identity', label: 'Brand Identity' },
      { id: 'brand-library', label: 'Creative Library' },
      { id: 'brand-design', label: 'Design' },
      { id: 'brand-strategy', label: 'Content Strategy' },
      { id: 'brand-tech', label: 'Tech' },
    ]
  },
  { id: 'history', label: 'Post History', icon: '▤' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
]

const isBrandPage = (page: string) => page === 'brand' || page.startsWith('brand-')

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [navOpen, setNavOpen] = useState(true)
  const [brandExpanded, setBrandExpanded] = useState(isBrandPage(currentPage))
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
          const hasChildren = item.children && item.children.length > 0
          const isParentActive = hasChildren
            ? isBrandPage(currentPage)
            : currentPage === item.id ||
              (currentPage === 'edit' && item.id === 'create') ||
              (currentPage === 'review' && item.id === 'create')

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    if (navOpen) {
                      setBrandExpanded(!brandExpanded)
                    } else {
                      setNavOpen(true)
                      setBrandExpanded(true)
                    }
                    if (!isBrandPage(currentPage)) {
                      onNavigate('brand-identity')
                    }
                  } else {
                    onNavigate(item.id)
                  }
                }}
                title={!navOpen ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 py-2.5 text-sm text-left transition-colors ${
                  navOpen ? 'px-4' : 'px-0 justify-center'
                } ${
                  isParentActive
                    ? hasChildren && navOpen ? 'text-blue-700 font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {navOpen && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {hasChildren && (
                      <span className="text-[10px] text-gray-400">{brandExpanded ? '▾' : '▸'}</span>
                    )}
                  </>
                )}
              </button>

              {/* Sub-navigation */}
              {hasChildren && navOpen && brandExpanded && item.children!.map((child) => {
                const isChildActive = currentPage === child.id
                return (
                  <button
                    key={child.id}
                    onClick={() => onNavigate(child.id)}
                    className={`w-full flex items-center py-2 text-sm text-left transition-colors pl-10 pr-4 ${
                      isChildActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <span className="truncate">{child.label}</span>
                  </button>
                )
              })}
            </div>
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
