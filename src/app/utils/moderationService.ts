/**
 * moderationService.ts
 * AI moderation layer for challenge completion posts.
 * Checks relevance, authenticity, and appropriateness before a post goes live.
 */

export type ModerationStatus = 'approved' | 'flagged' | 'rejected';

export interface ModerationResult {
  status: ModerationStatus;
  reason: string;
  score: number; // 0–1, higher = safer
}

interface ModerationInput {
  challengeTitle: string;
  challengeCategory: string | null;
  reflection: string;
  impactSummary: string;
}

const SYSTEM_PROMPT = `You are a content moderator for a climate action community platform. 
Users submit posts when they complete environmental challenges. Your job is to evaluate each post for:

1. RELEVANCE — Is the post related to the challenge? Does it describe actual climate/environmental action?
2. AUTHENTICITY — Does the content reflect genuine effort? Flag gibberish, copy-paste, or nonsensical text.
3. APPROPRIATENESS — Is it free of offensive, harmful, hateful, or spam content?

You must respond with ONLY a valid JSON object in this exact format:
{
  "status": "approved" | "flagged" | "rejected",
  "reason": "A short, friendly explanation (max 20 words)",
  "score": 0.00
}

Rules:
- "approved": Content is relevant, genuine, and appropriate. Score 0.70–1.00.
- "flagged": Content is borderline — unclear relevance, vague effort, or mildly suspicious. Score 0.40–0.69. Needs admin review.
- "rejected": Content is clearly spam, gibberish, offensive, or completely unrelated. Score 0.00–0.39.
- Score reflects overall safety/quality confidence (1 = clearly safe and genuine).
- Keep reason friendly and constructive, not accusatory.
- Empty optional fields (reflection, impactSummary) should not trigger rejection on their own.`;

export async function moderateSubmission(
  input: ModerationInput
): Promise<ModerationResult> {
  const { challengeTitle, challengeCategory, reflection, impactSummary } = input;

  // Build the user message
  const userMessage = [
    `Challenge: "${challengeTitle}"${challengeCategory ? ` (Category: ${challengeCategory})` : ''}`,
    reflection ? `Reflection: ${reflection}` : 'Reflection: (not provided)',
    impactSummary ? `Impact Summary: ${impactSummary}` : 'Impact Summary: (not provided)',
  ].join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', response.status);
      // Fail open — approve with a low-confidence score so the post isn't silently dropped
      return { status: 'approved', reason: 'Moderation service unavailable.', score: 0.5 };
    }

    const data = await response.json();
    const rawText = data.content
      ?.map((block: { type: string; text?: string }) => block.type === 'text' ? block.text : '')
      .join('')
      .trim();

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const status: ModerationStatus =
      ['approved', 'flagged', 'rejected'].includes(parsed.status)
        ? parsed.status
        : 'flagged';

    return {
      status,
      reason: parsed.reason || '',
      score: Math.min(1, Math.max(0, Number(parsed.score) || 0.5)),
    };
  } catch (err) {
    console.error('Moderation error:', err);
    // Fail open on parse errors
    return { status: 'approved', reason: 'Moderation check skipped.', score: 0.5 };
  }
}