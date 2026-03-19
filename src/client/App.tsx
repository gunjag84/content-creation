import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { BrandConfig } from './pages/BrandConfig'
import { CreatePost } from './pages/CreatePost'
import { EditPreview } from './pages/EditPreview'
import { ReviewDownload } from './pages/ReviewDownload'
import { PostHistory } from './pages/PostHistory'
import { Login } from './pages/Login'
import { InstagramPosts } from './pages/InstagramPosts'
import { useWizardStore } from './stores/wizardStore'

type Page = 'brand' | 'brand-identity' | 'brand-library' | 'brand-design' | 'brand-strategy' | 'brand-tech' | 'create' | 'edit' | 'review' | 'history' | 'instagram' | 'login'

export function App() {
  const [page, setPage] = useState<Page>('create')
  const [pageHistory, setPageHistory] = useState<Page[]>([])
  const [authChecked, setAuthChecked] = useState(false)

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

  // Navigate forward - resets wizard only when going to 'create' via sidebar
  const navigate = (p: Page) => {
    if (p === 'create') useWizardStore.getState().reset()
    setPageHistory(h => [...h, page])
    setPage(p)
  }

  // Go back one step without resetting wizard state
  const goBack = () => {
    if (pageHistory.length === 0) return
    const prev = pageHistory[pageHistory.length - 1]
    setPageHistory(h => h.slice(0, -1))
    setPage(prev)
  }

  const hasBack = pageHistory.length > 0

  const renderPage = () => {
    switch (page) {
      case 'brand':
      case 'brand-identity':
        return <BrandConfig section="identity" onBack={hasBack ? goBack : undefined} />
      case 'brand-library':
        return <BrandConfig section="library" onBack={hasBack ? goBack : undefined} />
      case 'brand-design':
        return <BrandConfig section="design" onBack={hasBack ? goBack : undefined} />
      case 'brand-strategy':
        return <BrandConfig section="strategy" onBack={hasBack ? goBack : undefined} />
      case 'brand-tech':
        return <BrandConfig section="tech" onBack={hasBack ? goBack : undefined} />
      case 'create':
        return <CreatePost onGenerated={() => { setPageHistory(h => [...h, page]); setPage('edit') }} />
      case 'edit':
        return <EditPreview onRender={() => { setPageHistory(h => [...h, page]); setPage('review') }} onBack={goBack} />
      case 'review':
        return <ReviewDownload onDone={() => navigate('history')} onBack={goBack} />
      case 'history':
        return <PostHistory />
      case 'instagram':
        return <InstagramPosts />
      default:
        return <CreatePost onGenerated={() => { setPageHistory(h => [...h, page]); setPage('edit') }} />
    }
  }

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  )
}
