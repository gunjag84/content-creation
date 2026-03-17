import { ipcMain } from 'electron'
import {
  insertPost,
  insertSlide,
  updatePostStatus,
  getBalanceMatrix,
  updateBalanceMatrix,
  getPostWithSlides,
  type PostInsert,
  type SlideInsert
} from '../db/queries'
import { getDatabase } from '../db/index'
import { generateWarnings } from '../services/learning-warnings'
import { calculatePillarBalance } from '../services/pillar-balance'
import { recommendContent } from '../services/recommendation'
import { SettingsService } from '../services/settings-service'

const settingsService = new SettingsService()

// Create new post
ipcMain.handle('posts:create', async (event, data: PostInsert) => {
  try {
    const postId = insertPost(data)
    return { success: true, postId }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Save slides for a post
ipcMain.handle('posts:save-slides', async (event, slides: SlideInsert[]) => {
  try {
    const db = getDatabase()
    const insertAllSlides = db.transaction((slides: SlideInsert[]) => {
      const slideIds: number[] = []
      for (const slide of slides) {
        const slideId = insertSlide(slide)
        slideIds.push(slideId)
      }
      return slideIds
    })
    const slideIds = insertAllSlides(slides)
    return { success: true, slideIds }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Update post status
ipcMain.handle(
  'posts:update-status',
  async (event, postId: number, status: 'draft' | 'approved' | 'exported') => {
    try {
      updatePostStatus(postId, status)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)

// Get post with slides
ipcMain.handle('posts:get-with-slides', async (event, postId: number) => {
  try {
    const result = getPostWithSlides(postId)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Get recommendation data (balance matrix + warnings + dashboard data + recommendation)
ipcMain.handle(
  'posts:get-recommendation-data',
  async (event, brandId: number = 1, targetPercentages: Record<string, number> = {}) => {
    try {
      const balanceEntries = getBalanceMatrix(brandId)
      const warnings = generateWarnings(balanceEntries)

      // Build target percentages from settings contentPillars if caller didn't provide them
      const settings = await settingsService.load()
      const derivedTargets: Record<string, number> = {
        'Generate Demand': settings.contentPillars?.generateDemand ?? 0,
        'Convert Demand': settings.contentPillars?.convertDemand ?? 0,
        'Nurture Loyalty': settings.contentPillars?.nurtureLoyalty ?? 0,
        ...targetPercentages // caller-supplied values override
      }

      const dashboardData = calculatePillarBalance(balanceEntries, derivedTargets)

      let recommendation = null
      if (balanceEntries.length > 0) {
        try {
          recommendation = recommendContent(brandId, balanceEntries)
        } catch {
          // Cold start or insufficient data - recommendation stays null
        }
      }

      return {
        success: true,
        data: {
          balanceEntries,
          warnings,
          dashboardData,
          recommendation
        }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)

// Update balance matrix for post variables
ipcMain.handle(
  'posts:update-balance',
  async (
    event,
    brandId: number,
    variables: Array<{ type: string; value: string }>
  ) => {
    try {
      const db = getDatabase()
      const updateAll = db.transaction((variables: Array<{ type: string; value: string }>) => {
        for (const variable of variables) {
          updateBalanceMatrix(brandId, variable.type, variable.value)
        }
      })
      updateAll(variables)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)
