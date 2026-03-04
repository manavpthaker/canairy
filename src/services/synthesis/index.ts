/**
 * Synthesis Engine for Canairy
 *
 * Detects patterns from indicator data, scores them, and optionally
 * enhances with Claude LLM for natural language synthesis.
 */

export { PATTERN_LIBRARY, detectPatterns, type Pattern, type PatternCondition } from './patternLibrary';
export { synthesizeCards, scoredPatternToCardData, type ScoredPattern, type SynthesisOutput } from './cardScorer';
export { synthesizePattern, synthesizeBatch, clearSynthesisCache, getCacheStats, type SynthesisResult } from './claudeService';
export { generateInsightCardWithEvidence } from './evidenceGenerator';
