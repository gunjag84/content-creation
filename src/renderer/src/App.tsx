import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar, type NavItem } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { TestRender } from './pages/TestRender'

function App() {
  const [activeItem, setActiveItem] = useState<NavItem>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />
      case 'create':
        return <TestRender />
      case 'settings':
        return (
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-2 text-slate-100">Settings</h1>
            <p className="text-slate-400 mb-8">
              Settings configuration will be implemented in Phase 2
            </p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <AppLayout
      sidebar={
        <Sidebar
          activeItem={activeItem}
          onNavigate={setActiveItem}
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
