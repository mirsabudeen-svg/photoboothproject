import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const schema = z.object({
  field: z.enum(['consentText', 'hashtag', 'description']),
  eventName: z.string().min(2).max(100),
  eventType: z.enum(['wedding', 'corporate', 'brand', 'festival', 'exhibition']).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { field, eventName, eventType } = parsed.data;
  const client = new OpenAI({ apiKey });

  const prompts: Record<string, string> = {
    consentText: `Write a concise, legally-sound photo booth consent statement for an event called "${eventName}" (${eventType ?? 'event'}). It should cover: permission to photograph, use of images for promotional purposes, 30-day retention, right to withdraw consent. Maximum 80 words. Plain language. No bullet points.`,
    hashtag: `Generate 3 creative, catchy hashtags for a photo booth at an event called "${eventName}" (${eventType ?? 'event'}). Format: #Tag1 #Tag2 #Tag3. No explanation.`,
    description: `Write a one-sentence professional description for an event called "${eventName}" suitable for operator notes. Maximum 20 words.`,
  };

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompts[field] }],
    max_tokens: 150,
    temperature: 0.7,
  });

  return NextResponse.json({
    result: completion.choices[0]?.message?.content?.trim() ?? '',
  });
}
