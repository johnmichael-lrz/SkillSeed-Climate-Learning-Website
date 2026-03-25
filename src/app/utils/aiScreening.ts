// AI pre-screening for quest submissions — calls Supabase Edge Function `ai-screen-quest`
// so the Groq API key stays server-side (not exposed via VITE_*).

import type { Quest } from '../types/database';
import { supabase } from './supabase';

export interface AIScreeningResult {
  confidence: number;
  recommendation: 'approve' | 'review' | 'reject';
  reasoning: string;
  photo_analysis?: string;
  reflection_analysis?: string;
}

/**
 * Runs AI pre-screening on a quest submission using Groq Vision API
 * 
 * @param photoUrl - Public URL of the uploaded photo
 * @param reflection - User's reflection text
 * @param quest - Quest object with title, description, and tier
 * @returns AIScreeningResult or null if screening fails
 */
export const runAiScreening = async (
  photoUrl: string,
  reflection: string,
  quest: Quest
): Promise<AIScreeningResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke<{
      result: AIScreeningResult | null;
      skipped?: boolean;
      error?: string;
    }>('ai-screen-quest', {
      body: {
        photoUrl,
        reflection,
        quest: {
          title: quest.title,
          description: quest.description,
          tier: quest.tier,
        },
      },
    });

    if (error) {
      console.error('AI screening function error:', error);
      return null;
    }

    if (!data || data.skipped || data.error || !data.result) {
      if (data?.error) {
        console.warn('AI screening:', data.error);
      }
      return null;
    }

    const result = data.result;
    if (
      typeof result.confidence !== 'number' ||
      !['approve', 'review', 'reject'].includes(result.recommendation) ||
      typeof result.reasoning !== 'string'
    ) {
      console.error('Invalid AI screening result structure:', result);
      return null;
    }

    return result;
  } catch (err) {
    console.error('AI screening failed:', err);
    return null;
  }
};

export default runAiScreening;
