import { LayoutDashboard, PenSquare, Settings, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavItem = 'dashboard' | 'create' | 'settings'
export type SettingsTab = 'brand-voice' | 'target-persona' | 'content-pillars' | 'themes' | 'mechanics' | 'content-defaults' | 'brand-guidance' | 'competitor-analysis' | 'story-tools' | 'viral-expertise' | 'master-prompt' | 'templates' | 'settings-history'

interface SidebarProps {
  activeItem: NavItem
  activeSettingsTab: SettingsTab
  onNavigate: (item: NavItem) => void
  onSettingsTabChange: (tab: SettingsTab) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ activeItem, activeSettingsTab, onNavigate, onSettingsTabChange, collapsed, onToggleCollapse }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create' as NavItem, label: 'Create Post', icon: PenSquare },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings }
  ]

  const settingsItems = [
    { id: 'brand-voice' as SettingsTab, label: 'Brand Voice' },
    { id: 'target-persona' as SettingsTab, label: 'Target Persona' },
    { id: 'content-pillars' as SettingsTab, label: 'Content Pillars' },
    { id: 'themes' as SettingsTab, label: 'Themes' },
    { id: 'mechanics' as SettingsTab, label: 'Post Mechanics' },
    { id: 'content-defaults' as SettingsTab, label: 'Content Defaults' },
    { id: 'brand-guidance' as SettingsTab, label: 'Brand Guidance' },
    { id: 'competitor-analysis' as SettingsTab, label: 'Competitor Analysis' },
    { id: 'story-tools' as SettingsTab, label: 'Story Tools' },
    { id: 'viral-expertise' as SettingsTab, label: 'Viral Expertise' },
    { id: 'master-prompt' as SettingsTab, label: 'Master Prompt' },
    { id: 'templates' as SettingsTab, label: 'Templates' },
    { id: 'settings-history' as SettingsTab, label: 'Settings History' }
  ]

  const showSettingsSubItems = activeItem === 'settings' && !collapsed

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Navigation items - pinned to top */}
      <nav className="flex flex-col items-start p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          const isSettings = item.id === 'settings'

          return (
            <div key={item.id} className="w-full">
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  'hover:bg-slate-800',
                  isActive && 'bg-slate-800 text-blue-400'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    {isSettings && (
                      <ChevronDown className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform',
                        showSettingsSubItems && 'rotate-180'
                      )} />
                    )}
                  </>
                )}
              </button>

              {/* Settings sub-items */}
              {isSettings && showSettingsSubItems && (
                <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[calc(100vh-300px)]">
                  {settingsItems.map((subItem) => {
                    const isSubActive = activeSettingsTab === subItem.id

                    return (
                      <button
                        key={subItem.id}
                        onClick={() => onSettingsTabChange(subItem.id)}
                        className={cn(
                          'w-full flex items-center px-3 py-2 pl-10 rounded-lg transition-colors text-sm',
                          'hover:bg-slate-800',
                          isSubActive && 'bg-slate-800 text-blue-400'
                        )}
                      >
                        {subItem.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Spacer to push collapse toggle to bottom */}
      <div className="flex-1" />

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
