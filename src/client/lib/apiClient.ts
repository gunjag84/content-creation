const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })

  if (res.status === 401) {
    window.location.hash = '#/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || res.statusText)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  upload: async (file: File): Promise<{ path: string; filename: string }> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/files/upload`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  },

  // SSE stream for generation
  streamGenerate: (body: unknown, onToken: (text: string) => void, onComplete: (result: unknown) => void, onError: (msg: string) => void): (() => void) => {
    const controller = new AbortController()

    fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }))
        onError(err.error)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()! // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'token') onToken(parsed.text)
            else if (parsed.type === 'complete') onComplete(parsed.result)
            else if (parsed.type === 'error') onError(parsed.message)
          } catch {}
        }
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') onError(err.message)
    })

    return () => controller.abort()
  },

  // Download ZIP
  downloadZip: async (body: unknown): Promise<void> => {
    const res = await fetch(`${BASE}/render/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'post.zip'
    a.click()
    URL.revokeObjectURL(url)
  }
}
