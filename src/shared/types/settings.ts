import { z } from 'zod'

// Brand Voice Schema
export const BrandVoiceSchema = z.object({
  tonality: z.string().optional(),
  dos: z.array(z.string()).optional(),
  donts: z.array(z.string()).optional(),
  examplePosts: z.array(z.string()).optional(),
  voiceProfile: z.string().optional()
}).optional()

// Target Persona Schema
export const TargetPersonaSchema = z.object({
  name: z.string().optional(),
  demographics: z.string().optional(),
  painPoints: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  languageExpectations: z.string().optional(),
  mediaConsumption: z.string().optional(),
  buyingBehavior: z.string().optional()
}).optional()

// Content Pillars - must sum to 100
export const ContentPillarsSchema = z
  .object({
    generateDemand: z.number().min(0).max(100),
    convertDemand: z.number().min(0).max(100),
    nurtureLoyalty: z.number().min(0).max(100)
  })
  .refine((data) => data.generateDemand + data.convertDemand + data.nurtureLoyalty === 100, {
    message: 'Content pillars must sum to 100%'
  })

// Theme Hierarchy Schema
const KernaussageSchema = z.object({
  id: z.string(),
  text: z.string(),
  active: z.boolean().default(true)
})

const UnterthemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  kernaussagen: z.array(KernaussageSchema),
  active: z.boolean().default(true)
})

const OberthemaSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pillarMapping: z.array(z.string()).optional(),
  unterthemen: z.array(UnterthemaSchema)
})

export const ThemesSchema = z.object({
  oberthemen: z.array(OberthemaSchema)
}).optional()

// Post Mechanics Schema
const MechanicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hookRules: z.string().optional(),
  slideRange: z.object({ min: z.number(), max: z.number() }).optional(),
  structureGuidelines: z.string().optional(),
  pillarMapping: z.array(z.string()).optional(),
  active: z.boolean().default(true)
})

export const MechanicsSchema = z.object({
  mechanics: z.array(MechanicSchema)
}).optional()

// Content Defaults
export const ContentDefaultsSchema = z.object({
  carouselSlideMin: z.number().min(1).default(3),
  carouselSlideMax: z.number().min(1).default(10),
  captionMaxChars: z.number().min(100).default(2200),
  hashtagMin: z.number().min(0).default(3),
  hashtagMax: z.number().min(0).default(30),
  storiesPerPost: z.number().min(0).default(3)
})

// Visual Guidance Schema
const FontConfigSchema = z.object({
  filename: z.string(),
  path: z.string(),
  family: z.string()
}).optional()

const LogoConfigSchema = z.object({
  path: z.string(),
  position: z.enum(['center', 'bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left']).default('bottom-center'),
  size: z.enum(['small', 'medium', 'large']).default('medium')
}).optional()

export const VisualGuidanceSchema = z.object({
  primaryColor: z.string().default('#000000'),
  secondaryColor: z.string().default('#666666'),
  backgroundColor: z.string().default('#ffffff'),
  headlineFont: FontConfigSchema,
  bodyFont: FontConfigSchema,
  ctaFont: FontConfigSchema,
  headlineFontSize: z.number().default(48),
  bodyFontSize: z.number().default(24),
  ctaFontSize: z.number().default(32),
  minFontSize: z.number().default(14),
  logo: LogoConfigSchema,
  standardCTA: z.string().optional(),
  instagramHandle: z.string().optional(),
  lastSlideRules: z.string().optional()
}).optional()

// Competitor Analysis Schema
export const CompetitorAnalysisSchema = z.object({
  text: z.string().optional()
}).optional()

// Story Tools Schema
const StoryToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  engagementType: z.string().optional(),
  pillarMapping: z.array(z.string()).optional(),
  mechanicRecommendations: z.array(z.string()).optional(),
  active: z.boolean().default(true)
})

export const StoryToolsSchema = z.object({
  tools: z.array(StoryToolSchema)
}).optional()

// Viral Expertise Schema
export const ViralExpertiseSchema = z.object({
  text: z.string().optional()
}).optional()

// Master Prompt Schema
export const MasterPromptSchema = z.object({
  template: z.string()
}).optional()

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

// Import default data
import mechanicsData from '../data/mechanics.json'
import storyToolsData from '../data/story-tools.json'
import themesData from '../data/themes.json'
import { DEFAULT_MASTER_PROMPT } from '../data/master-prompt-default'

// Default settings for first launch
export const DEFAULT_SETTINGS: Settings = {
  brandVoice: undefined,
  targetPersona: undefined,
  contentPillars: {
    generateDemand: 50,
    convertDemand: 30,
    nurtureLoyalty: 20
  },
  themes: themesData as any,
  mechanics: { mechanics: mechanicsData as any },
  contentDefaults: {
    carouselSlideMin: 3,
    carouselSlideMax: 10,
    captionMaxChars: 2200,
    hashtagMin: 5,
    hashtagMax: 15,
    storiesPerPost: 3
  },
  visualGuidance: undefined,
  competitorAnalysis: undefined,
  storyTools: { tools: storyToolsData as any },
  viralExpertise: undefined,
  masterPrompt: {
    template: DEFAULT_MASTER_PROMPT
  }
}
