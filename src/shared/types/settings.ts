import { z } from 'zod'

// Brand Voice
const BrandVoiceSchema = z
  .object({
    tone: z.string().optional(),
    personality: z.string().optional(),
    languageStyle: z.string().optional()
  })
  .optional()

// Target Persona
const TargetPersonaSchema = z
  .object({
    demographics: z.string().optional(),
    psychographics: z.string().optional(),
    painPoints: z.array(z.string()).optional()
  })
  .optional()

// Content Pillars - must sum to 100
const ContentPillarsSchema = z
  .object({
    generateDemand: z.number().min(0).max(100),
    convertDemand: z.number().min(0).max(100),
    nurtureLoyalty: z.number().min(0).max(100)
  })
  .refine((data) => data.generateDemand + data.convertDemand + data.nurtureLoyalty === 100, {
    message: 'Content pillars must sum to 100%'
  })

// Themes
const ThemesSchema = z
  .object({
    themes: z.array(z.string()).optional()
  })
  .optional()

// Mechanics
const MechanicsSchema = z
  .object({
    mechanics: z.array(z.string()).optional()
  })
  .optional()

// Content Defaults
const ContentDefaultsSchema = z.object({
  carouselSlideMin: z.number().min(1).default(3),
  carouselSlideMax: z.number().min(1).default(10),
  captionMaxChars: z.number().min(100).default(2200),
  hashtagMin: z.number().min(0).default(3),
  hashtagMax: z.number().min(0).default(30),
  storiesPerPost: z.number().min(0).default(3)
})

// Visual Guidance
const VisualGuidanceSchema = z
  .object({
    colors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    imageStyle: z.string().optional()
  })
  .optional()

// Competitor Analysis
const CompetitorAnalysisSchema = z
  .object({
    competitors: z.array(z.string()).optional(),
    insights: z.string().optional()
  })
  .optional()

// Story Tools
const StoryToolsSchema = z
  .object({
    tools: z.array(z.string()).optional()
  })
  .optional()

// Viral Expertise
const ViralExpertiseSchema = z
  .object({
    patterns: z.array(z.string()).optional(),
    insights: z.string().optional()
  })
  .optional()

// Master Prompt
const MasterPromptSchema = z
  .object({
    systemPrompt: z.string().optional(),
    additionalContext: z.string().optional()
  })
  .optional()

// Main Settings Schema
export const SettingsSchema = z.object({
  brandVoice: BrandVoiceSchema,
  targetPersona: TargetPersonaSchema,
  contentPillars: ContentPillarsSchema,
  themes: ThemesSchema,
  mechanics: MechanicsSchema,
  contentDefaults: ContentDefaultsSchema,
  visualGuidance: VisualGuidanceSchema,
  competitorAnalysis: CompetitorAnalysisSchema,
  storyTools: StoryToolsSchema,
  viralExpertise: ViralExpertiseSchema,
  masterPrompt: MasterPromptSchema
})

export type Settings = z.infer<typeof SettingsSchema>

// Default settings for first launch
export const DEFAULT_SETTINGS: Settings = {
  brandVoice: undefined,
  targetPersona: undefined,
  contentPillars: {
    generateDemand: 33,
    convertDemand: 34,
    nurtureLoyalty: 33
  },
  themes: undefined,
  mechanics: undefined,
  contentDefaults: {
    carouselSlideMin: 3,
    carouselSlideMax: 10,
    captionMaxChars: 2200,
    hashtagMin: 3,
    hashtagMax: 30,
    storiesPerPost: 3
  },
  visualGuidance: undefined,
  competitorAnalysis: undefined,
  storyTools: undefined,
  viralExpertise: undefined,
  masterPrompt: undefined
}
