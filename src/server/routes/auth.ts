import { Router } from 'express'
import { validatePassword, createSession } from '../middleware/auth'

const router = Router()

router.post('/login', (req, res) => {
  const { password } = req.body
  if (!validatePassword(password)) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }

  const token = createSession()
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  })
  res.json({ ok: true })
})

router.post('/logout', (_req, res) => {
  res.clearCookie('session')
  res.json({ ok: true })
})

router.get('/check', (req, res) => {
  // If auth middleware passed, we're good
  if (!process.env.APP_PASSWORD) {
    res.json({ authenticated: true, authRequired: false })
    return
  }
  // This route is exempt from auth - check manually
  const token = req.cookies?.session
  res.json({ authenticated: !!token, authRequired: true })
})

export default router
