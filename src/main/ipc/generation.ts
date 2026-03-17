import { ipcMain, BrowserWindow } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { SecurityService } from '../services/security-service'
import { SettingsService } from '../services/settings-service'
import { assembleMasterPrompt } from '../services/prompt-assembler'
import type { GenerationResult, StoryProposal } from '../../shared/types/generation'

const securityService = new SecurityService()
const settingsService = new SettingsService()

export function registerGenerationIPC() {
  // Generate content (feed post slides)
  ipcMain.handle('generate:content', async (event, args: {
    pillar: string
    theme: string
    mechanic: string
    contentType: 'single' | 'carousel'
    impulse: string
  }) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0]
    if (!win) {
      throw new Error('No available window')
    }

    // Load API key
    const apiKey = await securityService.loadAPIKey()
    if (!apiKey || apiKey.trim() === '') {
      win.webContents.send('generate:error', { message: 'API key not set. Please add your Anthropic API key in Settings.' })
      return { started: false }
    }

    // Load settings and assemble prompt
    const settings = await settingsService.load()
    const prompt = assembleMasterPrompt(
      args.pillar,
      args.theme,
      args.mechanic,
      args.impulse || '',
      settings,
      args.contentType
    )

    // Start streaming (async - don't await)
    streamContent(win, apiKey, prompt).catch(err => {
      win.webContents.send('generate:error', { message: err.message })
    })

    return { started: true, prompt }
  })

  // Generate hook alternatives
  ipcMain.handle('generate:hooks', async (event, args: { currentHook: string; slideContext: string; prompt: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0]
    if (!win) {
      throw new Error('No available window')
    }

    // Load API key
    const apiKey = await securityService.loadAPIKey()
    if (!apiKey || apiKey.trim() === '') {
      win.webContents.send('generate:error', { message: 'API key not set. Please add your Anthropic API key in Settings.' })
      return { started: false }
    }

    // Build hooks prompt from context
    const hooksPrompt = `You are a social media copywriting expert. Generate exactly 3 alternative hook options for an Instagram carousel slide.

Current hook: "${args.currentHook}"

Slide context: ${args.slideContext}

Requirements:
- Each hook must be a different angle/approach
- Keep hooks concise (1-2 sentences max)
- Make them attention-grabbing and scroll-stopping
- Return ONLY a JSON array of 3 strings, no markdown, no explanation

Example format: ["Hook option 1", "Hook option 2", "Hook option 3"]`

    // Start streaming (async - don't await)
    streamHooks(win, apiKey, hooksPrompt).catch(err => {
      win.webContents.send('generate:error', { message: err.message })
    })

    return { started: true }
  })

  // Generate story proposals
  ipcMain.handle('generate:stories', async (event, args: { prompt: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0]
    if (!win) {
      throw new Error('No available window')
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
      win.webContents.send('generate:token', { token: text, type: 'content' })
    })

    const message = await stream.finalMessage()
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown code fences if Claude wrapped the JSON despite instructions
    const responseText = rawText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim()

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
      win.webContents.send('generate:token', { token: text, type: 'hooks' })
    })

    const message = await stream.finalMessage()
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown code fences if Claude wrapped the JSON despite instructions
    const responseText = rawText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim()

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
      win.webContents.send('generate:token', { token: text, type: 'stories' })
    })

    const message = await stream.finalMessage()
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown code fences if Claude wrapped the JSON despite instructions
    const responseText = rawText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim()

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
