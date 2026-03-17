import { Component, useState, useCallback } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar, type NavItem, type SettingsTab } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { CreatePost } from './pages/CreatePost'
import { Settings } from './pages/Settings'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: '#e2e8f0' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{ color: '#f87171', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const [activeItem, setActiveItem] = useState<NavItem>('dashboard')
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('brand-voice')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Template routing state for create flow -> template builder -> back
  const [pendingTemplateImage, setPendingTemplateImage] = useState<string | null>(null)
  const [returnToCreate, setReturnToCreate] = useState(false)

  const handleNavigate = (item: NavItem) => {
    setActiveItem(item)
    if (item === 'settings') {
      setSidebarCollapsed(false)
    }
  }

  // Called from create flow when user uploads an image and wants to configure template
  const handleCreateFlowTemplateRequest = useCallback((imagePath: string) => {
    setPendingTemplateImage(imagePath)
    setReturnToCreate(true)
    setActiveSettingsTab('templates')
    setActiveItem('settings')
  }, [])

  // Called when template is saved from create flow routing
  const handleTemplateSaveAndReturn = useCallback(() => {
    setPendingTemplateImage(null)
    if (returnToCreate) {
      setReturnToCreate(false)
      setActiveItem('create')
    }
  }, [returnToCreate])

  const renderPage = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'create':
        return (
          <CreatePost
            onNavigate={handleNavigate}
            onRequestTemplateBuilder={handleCreateFlowTemplateRequest}
          />
        )
      case 'settings':
        return (
          <Settings
            activeTab={activeSettingsTab}
            pendingTemplateImage={pendingTemplateImage}
            onTemplateSaveAndReturn={handleTemplateSaveAndReturn}
          />
        )
      default:
        return <Dashboard onNavigate={handleNavigate} />
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
      <ErrorBoundary>
        {renderPage()}
      </ErrorBoundary>
    </AppLayout>
  )
}

export default App
