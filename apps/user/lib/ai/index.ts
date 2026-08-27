import { geminiConfigured, geminiSummary, GEMINI_MODEL } from './gemini'
import { heuristicSummary } from './heuristic'
import type { AiSummary, SummaryInput } from './types'

export type { AiSummary, Sentiment, SummaryInput, SummarySource, PostSummaryPayload } from './types'
export { heuristicSummary } from './heuristic'
export { GEMINI_MODEL } from './gemini'

/**
 * The provider seam.
 *
 * Everything else in the app calls generateSummary() and never imports a
 * provider directly. Adding Groq or an OpenAI-compatible endpoint means one new
 * file beside gemini.ts and one branch here — the route handler, the card and
 * the database stay untouched.
 */

export interface SummaryResult {
  summary: AiSummary
  /** 'model' when a provider produced it, 'heuristic' when the fallback did. */
  source: 'model' | 'heuristic'
  model: string
}

export const HEURISTIC_MODEL = 'rule-based'

export function modelConfigured(): boolean {
  return geminiConfigured()
}

/**
 * Never throws. A provider failure — no key, quota exhausted, timeout, malformed
 * response — degrades to the rule-based summary so a thread always renders.
 */
export async function generateSummary(
  input: SummaryInput,
): Promise<SummaryResult> {
  if (geminiConfigured()) {
    try {
      return {
        summary: await geminiSummary(input),
        source: 'model',
        model: GEMINI_MODEL,
      }
    } catch (err) {
      console.error('[ai] Gemini summary failed, falling back:', err)
    }
  }

  return {
    summary: heuristicSummary(input),
    source: 'heuristic',
    model: HEURISTIC_MODEL,
  }
}
