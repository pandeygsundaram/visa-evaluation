import OpenAI from 'openai';
import { buildCompletePrompt, validateLLMResponse, PromptData } from '../utils/promptBuilder';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface AnalysisResult {
  isMalicious: boolean;
  maliciousReason?: string;
  score: number;
  summary: string;
  checkpoints?: Array<{
    checkpoint: string;
    status: 'met' | 'partially_met' | 'not_met' | 'not_applicable';
    evidence?: string;
    feedback?: string;
    score?: number;
  }>;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  rawResponse?: string;
}

/**
 * Analyze document using OpenAI
 */
export async function analyzeDocument(
  documentText: string,
  promptData: PromptData
): Promise<AnalysisResult> {
  try {
    // Build the prompt
    const { systemPrompt, userPrompt } = buildCompletePrompt({
      ...promptData,
      documentText
    });

    console.log('🤖 Calling OpenAI for document analysis...');

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // or 'gpt-4' or 'gpt-3.5-turbo'
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' }, // Ensure JSON response
      max_tokens: 4000
    });

    const rawResponse = completion.choices[0]?.message?.content;

    if (!rawResponse) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ Received response from OpenAI');

    // Validate and parse the response
    const validatedResponse = validateLLMResponse(rawResponse);

    return {
      ...validatedResponse,
      rawResponse
    };
  } catch (error: any) {
    console.error('❌ OpenAI analysis error:', error);

    // If OpenAI API fails, return a safe error response
    if (error.code === 'insufficient_quota' || error.status === 429) {
      throw new Error('OpenAI API quota exceeded. Please check your API key and billing.');
    }

    if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    }

    throw new Error(`Document analysis failed: ${error.message}`);
  }
}

/**
 * Validate OpenAI configuration
 */
export function validateOpenAIConfig(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Missing OPENAI_API_KEY in environment variables');
    return false;
  }

  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.warn('⚠️  Invalid OPENAI_API_KEY format');
    return false;
  }

  return true;
}

/**
 * Test OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });

    return !!response.choices[0]?.message?.content;
  } catch (error: any) {
    console.error('OpenAI connection test failed:', error.message);
    return false;
  }
}
