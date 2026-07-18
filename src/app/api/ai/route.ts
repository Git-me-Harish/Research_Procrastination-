/**
 * AI Gateway Route — uses REAL z-ai-web-dev-sdk (GLM-4.6 model)
 *
 * The Python FastAPI backend calls this endpoint to get AI responses.
 * This is NOT mock data — it's a real LLM call.
 *
 * For production deployment on Windows:
 *   - Replace this with a direct Python call to Gemini/Groq/HuggingFace API
 *   - See /mini-services/bam-api/ai_service.py for the integration point
 */
import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface AIGatewayPayload {
  prompt: string;
  system?: string;
  max_tokens?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AIGatewayPayload;
    const { prompt, system = '', max_tokens = 1500 } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens,
    });

    const content = response.choices?.[0]?.message?.content || '';
    return NextResponse.json({ content, model: 'glm-4.6' });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[AI Gateway] error:', error);
    return NextResponse.json(
      { error: 'AI gateway failed', detail: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'BAM! AI Gateway',
    model: 'glm-4.6 (real, via z-ai-web-dev-sdk)',
    usage: 'POST { prompt, system?, max_tokens? }',
  });
}
