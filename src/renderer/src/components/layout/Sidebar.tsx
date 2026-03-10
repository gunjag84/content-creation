import { LayoutDashboard, PenSquare, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavItem = 'dashboard' | 'create' | 'settings'

interface SidebarProps {
  activeItem: NavItem
  onNavigate: (item: NavItem) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ activeItem, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create' as NavItem, label: 'Create Post', icon: PenSquare },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings }
  ]

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-slate-800',
                isActive && 'bg-slate-800 text-blue-400'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2 text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
