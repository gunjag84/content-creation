import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar, type NavItem } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { TestRender } from './pages/TestRender'
import { Settings } from './pages/Settings'

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
        return <Settings />
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
