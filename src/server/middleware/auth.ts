import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

// Simple session store (in-memory, single user)
const sessions = new Map<string, { createdAt: number }>()
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24h

export function createSession(): string {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { createdAt: Date.now() })
  return token
}

export function validatePassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD
  if (!expected) return true // No password set = no auth required
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // No password configured = skip auth
  if (!process.env.APP_PASSWORD) {
    next()
    return
  }

  // Allow auth routes
  if (req.path.startsWith('/api/auth')) {
    next()
    return
  }

  // Allow static assets
  if (!req.path.startsWith('/api/')) {
    next()
    return
  }

  const token = req.cookies?.session
  if (!token || !sessions.has(token)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const session = sessions.get(token)!
  if (Date.now() - session.createdAt > SESSION_MAX_AGE) {
    sessions.delete(token)
    res.status(401).json({ error: 'Session expired' })
    return
  }

  next()
}
