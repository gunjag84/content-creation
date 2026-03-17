import { ReactNode } from 'react'

interface AppLayoutProps {
  sidebar: ReactNode
  children: ReactNode
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {sidebar}
      <main className="flex-1 min-h-0 overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  )
}
