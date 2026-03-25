import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type QuestPayload = {
  title: string;
  description?: string | null;
  tier: string;
};

type Body = {
  photoUrl?: string;
  reflection?: string;
  quest?: QuestPayload;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { photoUrl, reflection, quest } = payload;
  if (
    !photoUrl ||
    typeof photoUrl !== 'string' ||
    !reflection ||
    typeof reflection !== 'string' ||
    !quest?.title ||
    !quest?.tier
  ) {
    return jsonResponse({ error: 'Missing photoUrl, reflection, or quest fields' }, 400);
  }

  if (reflection.length > 8000) {
    return jsonResponse({ error: 'Reflection too long' }, 400);
  }

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) {
    console.warn('GROQ_API_KEY not set — skipping screening');
    return jsonResponse({ skipped: true, result: null }, 200);
  }

  const prompt = `You are verifying a quest submission for SkillSeed, a climate learning platform based in the Philippines.

Quest: "${quest.title}"
Quest description: "${quest.description || 'No description provided'}"
Quest tier: "${quest.tier}" (beginner = badge reward, advanced = certificate reward)

The user submitted this reflection:
"${reflection}"

Carefully analyse BOTH the photo and the reflection together.

Check the following:
1. Does the photo show clear visual evidence of the quest being completed?
2. Does the reflection demonstrate genuine effort, learning, and understanding?
3. Is there consistency between what the photo shows and what the reflection describes?
4. Are there any red flags? (irrelevant photo, very short reflection, copy-pasted text, no real effort shown)

Respond ONLY in this exact JSON format with no other text, no markdown, no backticks:
{
  "confidence": <number from 0 to 100>,
  "recommendation": "<approve or review or reject>",
  "reasoning": "<2-3 sentences explaining your overall assessment>",
  "photo_analysis": "<1-2 sentences on what you see in the photo and whether it matches the quest>",
  "reflection_analysis": "<1-2 sentences on the quality and genuineness of the reflection>"
}`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: photoUrl, detail: 'high' },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error('Groq error:', groqRes.status, errText);
    return jsonResponse({ error: 'Screening service error', result: null }, 502);
  }

  const groqData = (await groqRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = groqData.choices?.[0]?.message?.content ?? '';
  const clean = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    const result = JSON.parse(clean) as {
      confidence: number;
      recommendation: string;
      reasoning: string;
      photo_analysis?: string;
      reflection_analysis?: string;
    };
    if (
      typeof result.confidence !== 'number' ||
      !['approve', 'review', 'reject'].includes(result.recommendation) ||
      typeof result.reasoning !== 'string'
    ) {
      return jsonResponse({ error: 'Invalid model output', result: null }, 502);
    }
    return jsonResponse({ result }, 200);
  } catch {
    console.error('Parse failed, raw:', text);
    return jsonResponse({ error: 'Could not parse screening result', result: null }, 502);
  }
});
