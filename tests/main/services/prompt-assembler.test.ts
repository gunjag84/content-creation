import { describe, it, expect } from 'vitest'
import { assembleMasterPrompt, assembleStoryPrompt } from '../../../src/main/services/prompt-assembler'
import type { Settings } from '../../../src/shared/types/settings'
import type { GenerationResult, StoryProposal } from '../../../src/shared/types/generation'

describe('assembleMasterPrompt', () => {
  const minimalSettings: Settings = {
    brandVoice: {
      tonality: 'Professional and approachable',
      dos: ['Use clear language', 'Be concise'],
      donts: ['Avoid jargon', 'No exclamation marks'],
      voiceProfile: 'Expert consultant'
    },
    targetPersona: {
      name: 'Marketing Manager',
      demographics: '30-45, urban professional',
      painPoints: ['Limited time', 'Budget constraints'],
      goals: ['Increase ROI', 'Streamline workflows']
    },
    contentPillars: {
      generateDemand: 50,
      convertDemand: 30,
      nurtureLoyalty: 20
    },
    contentDefaults: {
      carouselSlideMin: 3,
      carouselSlideMax: 10,
      captionMaxChars: 2200,
      hashtagMin: 5,
      hashtagMax: 15,
      storiesPerPost: 3
    },
    mechanics: {
      mechanics: [
        {
          id: 'hook',
          name: 'Hook',
          description: 'Start with a question',
          hookRules: 'Use curiosity gap',
          slideRange: { min: 3, max: 5 },
          structureGuidelines: 'Problem -> Solution -> CTA',
          active: true
        },
        {
          id: 'list',
          name: 'List',
          description: 'Numbered list format',
          active: false
        }
      ]
    },
    masterPrompt: {
      template: 'Generate content following these guidelines:\n{sections}\n\nEnd with a clear call to action.'
    }
  }

  describe('required sections', () => {
    it('should include brand voice section', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).toContain('Professional and approachable')
      expect(prompt).toContain('Use clear language')
      expect(prompt).toContain('Avoid jargon')
    })

    it('should include target persona section', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).toContain('Marketing Manager')
      expect(prompt).toContain('30-45, urban professional')
      expect(prompt).toContain('Limited time')
      expect(prompt).toContain('Increase ROI')
    })

    it('should include pillar and theme', () => {
      const prompt = assembleMasterPrompt('Convert Demand', 'Sales Techniques', 'Hook', '', minimalSettings)

      expect(prompt).toContain('Convert Demand')
      expect(prompt).toContain('Sales Techniques')
    })

    it('should include content defaults', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).toContain('3')
      expect(prompt).toContain('10')
      expect(prompt).toContain('2200')
    })

    it('should always end with master prompt template', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).toContain('End with a clear call to action')
      expect(prompt.indexOf('End with a clear call to action')).toBeGreaterThan(prompt.indexOf('Professional'))
    })
  })

  describe('mechanic rules', () => {
    it('should include mechanic rules when mechanic is active', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).toContain('Hook')
      expect(prompt).toContain('Use curiosity gap')
      expect(prompt).toContain('Problem -> Solution -> CTA')
    })

    it('should skip mechanic section when mechanic is inactive', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'List', '', minimalSettings)

      // Should still work but without detailed mechanic rules
      expect(prompt).toBeTruthy()
      expect(prompt).not.toContain('Numbered list format')
    })

    it('should handle mechanic not found in settings', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'NonExistent', '', minimalSettings)

      // Should not crash
      expect(prompt).toBeTruthy()
    })
  })

  describe('optional sections', () => {
    it('should skip competitor analysis when empty', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).not.toContain('Competitor')
      expect(prompt).not.toContain('competitor')
    })

    it('should include competitor analysis when provided', () => {
      const settingsWithCompetitor: Settings = {
        ...minimalSettings,
        competitorAnalysis: {
          text: 'Competitor X uses emotional storytelling. Avoid their style.'
        }
      }

      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', settingsWithCompetitor)

      expect(prompt).toContain('Competitor X uses emotional storytelling')
    })

    it('should skip viral expertise when empty', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).not.toContain('Viral')
      expect(prompt).not.toContain('viral')
    })

    it('should include viral expertise when provided', () => {
      const settingsWithViral: Settings = {
        ...minimalSettings,
        viralExpertise: {
          text: 'Pattern interrupts work well. Use contrarian takes.'
        }
      }

      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', settingsWithViral)

      expect(prompt).toContain('Pattern interrupts work well')
    })

    it('should append impulse as Additional Guidance when provided', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', 'Focus on time-saving benefits', minimalSettings)

      expect(prompt).toContain('Additional Guidance')
      expect(prompt).toContain('Focus on time-saving benefits')
    })

    it('should skip impulse section when empty', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)

      expect(prompt).not.toContain('Additional Guidance')
    })
  })

  describe('token estimation and truncation', () => {
    it('should estimate token count', () => {
      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', minimalSettings)
      const estimatedTokens = Math.ceil(prompt.length / 4)

      // Minimal settings should be under 8000 tokens
      expect(estimatedTokens).toBeLessThan(8000)
    })

    it('should truncate optional sections when exceeding 8000 tokens', () => {
      // Create a massive competitor analysis to trigger truncation
      const largeText = 'A'.repeat(30000)
      const settingsWithLargeContent: Settings = {
        ...minimalSettings,
        competitorAnalysis: {
          text: largeText
        },
        viralExpertise: {
          text: 'Some viral expertise'
        }
      }

      const prompt = assembleMasterPrompt('Generate Demand', 'Coaching', 'Hook', '', settingsWithLargeContent)
      const estimatedTokens = Math.ceil(prompt.length / 4)

      // Should truncate to stay under or near 8000 tokens
      expect(estimatedTokens).toBeLessThan(9000)
      // Competitor should be dropped first
      expect(prompt).not.toContain(largeText)
    })
  })
})

describe('assembleStoryPrompt', () => {
  const minimalSettings: Settings = {
    brandVoice: {
      tonality: 'Professional'
    },
    targetPersona: {
      name: 'Professional'
    },
    contentPillars: {
      generateDemand: 50,
      convertDemand: 30,
      nurtureLoyalty: 20
    },
    contentDefaults: {
      carouselSlideMin: 3,
      carouselSlideMax: 10,
      captionMaxChars: 2200,
      hashtagMin: 5,
      hashtagMax: 15,
      storiesPerPost: 3
    },
    masterPrompt: {
      template: 'Story template'
    }
  }

  const generationResult: GenerationResult = {
    slides: [
      { slide_type: 'cover', hook_text: 'Hook 1', body_text: 'Body 1', cta_text: '' },
      { slide_type: 'content', hook_text: 'Hook 2', body_text: 'Body 2', cta_text: '' }
    ],
    caption: 'Test caption'
  }

  const storyProposal: StoryProposal = {
    story_type: 'teaser',
    tool_type: 'poll',
    tool_content: '{"question": "What is your biggest challenge?", "options": ["Time", "Money"]}',
    timing: 'before',
    source_slide_index: 0,
    text_content: 'Preview text',
    rationale: 'Engagement boost'
  }

  it('should include feed post context', () => {
    const prompt = assembleStoryPrompt('Generate Demand', 'Coaching', generationResult, storyProposal, minimalSettings)

    expect(prompt).toContain('Hook 1')
    expect(prompt).toContain('Body 1')
    expect(prompt).toContain('Test caption')
  })

  it('should include story proposal details', () => {
    const prompt = assembleStoryPrompt('Generate Demand', 'Coaching', generationResult, storyProposal, minimalSettings)

    expect(prompt).toContain('teaser')
    expect(prompt).toContain('poll')
    expect(prompt).toContain('What is your biggest challenge?')
  })

  it('should request final story text and tool content', () => {
    const prompt = assembleStoryPrompt('Generate Demand', 'Coaching', generationResult, storyProposal, minimalSettings)

    // Prompt should ask Claude to generate story-specific content
    expect(prompt.toLowerCase()).toContain('story')
  })
})
