import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { config } from 'dotenv'
import { initDatabase, closeDatabase } from './db/index'
import { authMiddleware } from './middleware/auth'
import authRoutes from './routes/auth'
import settingsRoutes from './routes/settings'
import generateRoutes from './routes/generate'
import renderRoutes from './routes/render'
import postsRoutes from './routes/posts'
import filesRoutes from './routes/files'
import instagramRoutes from './routes/instagram'

config() // Load .env

const app = express()
const PORT = parseInt(process.env.PORT || '3001')

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(authMiddleware)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/render', renderRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/files', filesRoutes)
app.use('/api/instagram', instagramRoutes)

// In production, serve the built client
const clientDist = path.join(__dirname, '..', 'client')
app.use(express.static(clientDist))
// SPA fallback - serve index.html for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(clientDist, 'index.html'))
})

// Initialize DB and start server
initDatabase()

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close()
  closeDatabase()
  process.exit(0)
})

process.on('SIGINT', () => {
  server.close()
  closeDatabase()
  process.exit(0)
})
