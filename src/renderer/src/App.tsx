import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar, type NavItem, type SettingsTab } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { CreatePost } from './pages/CreatePost'
import { Settings } from './pages/Settings'

function App() {
  const [activeItem, setActiveItem] = useState<NavItem>('dashboard')
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('brand-voice')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleNavigate = (item: NavItem) => {
    setActiveItem(item)
    // Auto-expand sidebar when navigating to settings
    if (item === 'settings') {
      setSidebarCollapsed(false)
    }
  }

  const renderPage = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />
      case 'create':
        return <CreatePost onNavigate={handleNavigate} />
      case 'settings':
        return <Settings activeTab={activeSettingsTab} />
      default:
        return <Dashboard />
    }
  }

  return (
    <AppLayout
      sidebar={
        <Sidebar
          activeItem={activeItem}
          activeSettingsTab={activeSettingsTab}
          onNavigate={handleNavigate}
          onSettingsTabChange={setActiveSettingsTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      }
    >
      {renderPage()}
    </AppLayout>
  )
}

export default App
