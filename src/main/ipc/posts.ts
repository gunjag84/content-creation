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
import { generateWarnings } from '../services/learning-warnings'
import { calculatePillarBalance } from '../services/pillar-balance'

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
    const slideIds: number[] = []
    for (const slide of slides) {
      const slideId = insertSlide(slide)
      slideIds.push(slideId)
    }
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

// Get recommendation data (balance matrix + warnings + dashboard data)
ipcMain.handle(
  'posts:get-recommendation-data',
  async (event, brandId: number, targetPercentages: Record<string, number>) => {
    try {
      const balanceEntries = getBalanceMatrix(brandId)
      const warnings = generateWarnings(balanceEntries)
      const dashboardData = calculatePillarBalance(balanceEntries, targetPercentages)

      return {
        success: true,
        data: {
          balanceEntries,
          warnings,
          dashboardData
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
      for (const variable of variables) {
        updateBalanceMatrix(brandId, variable.type, variable.value)
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
)
