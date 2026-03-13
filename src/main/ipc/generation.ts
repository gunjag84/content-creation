import { ipcMain, BrowserWindow } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { SecurityService } from '../services/security-service'
import type { GenerationResult, StoryProposal } from '../../shared/types/generation'

const securityService = new SecurityService()

export function registerGenerationIPC() {
  // Generate content (feed post slides)
  ipcMain.handle('generate:content', async (_event, args: { prompt: string }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) {
      throw new Error('No focused window')
    }

    // Load API key
    const apiKey = await securityService.loadAPIKey()
    if (!apiKey || apiKey.trim() === '') {
      win.webContents.send('generate:error', { message: 'API key not set. Please add your Anthropic API key in Settings.' })
      return { started: false }
    }

    // Start streaming (async - don't await)
    streamContent(win, apiKey, args.prompt).catch(err => {
      win.webContents.send('generate:error', { message: err.message })
    })

    return { started: true }
  })

  // Generate hook alternatives
  ipcMain.handle('generate:hooks', async (_event, args: { currentHook: string; slideContext: string; prompt: string }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) {
      throw new Error('No focused window')
    }

    // Load API key
    const apiKey = await securityService.loadAPIKey()
    if (!apiKey || apiKey.trim() === '') {
      win.webContents.send('generate:error', { message: 'API key not set. Please add your Anthropic API key in Settings.' })
      return { started: false }
    }

    // Start streaming (async - don't await)
    streamHooks(win, apiKey, args.prompt).catch(err => {
      win.webContents.send('generate:error', { message: err.message })
    })

    return { started: true }
  })

  // Generate story proposals
  ipcMain.handle('generate:stories', async (_event, args: { prompt: string }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) {
      throw new Error('No focused window')
    }

    // Load API key
    const apiKey = await securityService.loadAPIKey()
    if (!apiKey || apiKey.trim() === '') {
      win.webContents.send('generate:error', { message: 'API key not set. Please add your Anthropic API key in Settings.' })
      return { started: false }
    }

    // Start streaming (async - don't await)
    streamStories(win, apiKey, args.prompt).catch(err => {
      win.webContents.send('generate:error', { message: err.message })
    })

    return { started: true }
  })
}

// Stream content generation
async function streamContent(win: BrowserWindow, apiKey: string, prompt: string) {
  const client = new Anthropic({ apiKey })
  let partialResponse = ''

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    stream.on('text', (text) => {
      partialResponse += text
      win.webContents.send('generate:token', text)
    })

    const message = await stream.finalMessage()
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse as JSON
    const generationResult: GenerationResult = JSON.parse(responseText)
    win.webContents.send('generate:complete', generationResult)
  } catch (err) {
    // Include partial response for recovery if available
    const errorPayload = partialResponse
      ? { message: (err as Error).message, partial: partialResponse }
      : { message: (err as Error).message }
    win.webContents.send('generate:error', errorPayload)
  }
}

// Stream hook alternatives
async function streamHooks(win: BrowserWindow, apiKey: string, prompt: string) {
  const client = new Anthropic({ apiKey })
  let partialResponse = ''

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })

    stream.on('text', (text) => {
      partialResponse += text
      win.webContents.send('generate:token', text)
    })

    const message = await stream.finalMessage()
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse as JSON array of hook strings
    const hooks: string[] = JSON.parse(responseText)
    win.webContents.send('generate:hooks-complete', { hooks })
  } catch (err) {
    const errorPayload = partialResponse
      ? { message: (err as Error).message, partial: partialResponse }
      : { message: (err as Error).message }
    win.webContents.send('generate:error', errorPayload)
  }
}

// Stream story proposals
async function streamStories(win: BrowserWindow, apiKey: string, prompt: string) {
  const client = new Anthropic({ apiKey })
  let partialResponse = ''

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    stream.on('text', (text) => {
      partialResponse += text
      win.webContents.send('generate:token', text)
    })

    const message = await stream.finalMessage()
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse as JSON array of StoryProposal objects
    const proposals: StoryProposal[] = JSON.parse(responseText)
    win.webContents.send('generate:stories-complete', { proposals })
  } catch (err) {
    const errorPayload = partialResponse
      ? { message: (err as Error).message, partial: partialResponse }
      : { message: (err as Error).message }
    win.webContents.send('generate:error', errorPayload)
  }
}
