import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { BrandConfig } from './pages/BrandConfig'
import { CreatePost } from './pages/CreatePost'
import { EditPreview } from './pages/EditPreview'
import { ReviewDownload } from './pages/ReviewDownload'
import { PostHistory } from './pages/PostHistory'
import { Login } from './pages/Login'
import { useWizardStore } from './stores/wizardStore'

type Page = 'brand' | 'create' | 'edit' | 'review' | 'history' | 'login'

export function App() {
  const [page, setPage] = useState<Page>('create')
  const [authChecked, setAuthChecked] = useState(false)
  const wizardStep = useWizardStore((s) => s.step)

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => {
        if (data.authRequired && !data.authenticated) {
          setPage('login')
        }
        setAuthChecked(true)
      })
      .catch(() => setAuthChecked(true))
  }, [])

  if (!authChecked) return null

  if (page === 'login') {
    return <Login onSuccess={() => setPage('create')} />
  }

  // Auto-navigate based on wizard step
  const navigate = (p: Page) => {
    if (p === 'create') useWizardStore.getState().reset()
    setPage(p)
  }

  const renderPage = () => {
    switch (page) {
      case 'brand': return <BrandConfig />
      case 'create': return <CreatePost onGenerated={() => setPage('edit')} />
      case 'edit': return <EditPreview onRender={() => setPage('review')} />
      case 'review': return <ReviewDownload onDone={() => navigate('history')} />
      case 'history': return <PostHistory />
      default: return <CreatePost onGenerated={() => setPage('edit')} />
    }
  }

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  )
}
