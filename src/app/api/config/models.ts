/**
 * COST-OPTIMIZED MODEL CONFIGURATION
 * ===================================
 * 
 * This configuration uses a tiered approach to minimize costs while maintaining quality:
 * - Lightweight models for simple tasks (classification, routing)
 * - Mid-tier models for structured edits
 * - High-tier models for complex generation
 * - Premium models only for critical final output
 */

export const MODEL_CONFIG = {
  // Lightweight tasks (classification, simple routing, general Q&A)
  // Cost: ~$0.27 per 1M tokens (using versatile model for reliability)
  intentAnalysis: 'llama-3.3-70b-versatile',
  generalQuestions: 'llama-3.3-70b-versatile',
  
  // Mid-tier tasks (structured edits with clear instructions)
  // Cost: ~$0.27 per 1M tokens
  editSummary: 'llama-3.3-70b-versatile',
  editSkills: 'llama-3.3-70b-versatile',
  editEducation: 'llama-3.3-70b-versatile',
  
  // High-tier tasks (complex generation requiring reasoning)
  // Using Gemini API for better reasoning capabilities (with Groq fallback)
  resumeParser: 'gemini-2.0-flash', // Fast, accurate PDF parsing with large context
  editExperience: 'gemini-2.0-flash',
  editProject: 'gemini-2.0-flash',
  jobAnalyzer: 'gemini-2.0-flash',
  profileMatcher: 'gemini-2.0-flash',
  experienceOptimizer: 'gemini-2.0-flash',
  projectOptimizer: 'gemini-2.0-flash',
  skillsEnhancer: 'gemini-2.0-flash',
  
  // Fallback models for high-tier tasks (used when Gemini quota is exceeded)
  editExperienceFallback: 'llama-3.3-70b-versatile',
  editProjectFallback: 'llama-3.3-70b-versatile',
  jobAnalyzerFallback: 'llama-3.3-70b-versatile',
  profileMatcherFallback: 'llama-3.3-70b-versatile',
  experienceOptimizerFallback: 'llama-3.3-70b-versatile',
  projectOptimizerFallback: 'llama-3.3-70b-versatile',
  skillsEnhancerFallback: 'llama-3.3-70b-versatile',
  
  // Premium tasks (critical final output requiring highest quality)
  // Cost: ~$0.50-1.00 per 1M tokens
  summaryGenerator: 'openai/gpt-oss-120b',
  jdOptimization: 'openai/gpt-oss-120b',
  finalPolish: 'openai/gpt-oss-120b',
} as const;

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
} as const;

// ============================================================================
// CUSTOM ERROR TYPES
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class JsonParseError extends Error {
  constructor(
    message: string,
    public readonly rawContent: string,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'JsonParseError';
  }
}

export class TruncatedResponseError extends JsonParseError {
  constructor(rawContent: string) {
    super(
      'Response was truncated. The AI output was cut off before completion.',
      rawContent,
      true // Truncated responses are retryable
    );
    this.name = 'TruncatedResponseError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the appropriate model for a given task
 */
export function getModelForTask(task: keyof typeof MODEL_CONFIG): string {
  return MODEL_CONFIG[task];
}

/**
 * API endpoint configuration
 */
export const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
export const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Get API key based on model provider
 */
export function getApiKey(model: string): string {
  if (model.startsWith('gemini')) {
    return process.env.GEMINI_API_KEY || '';
  }
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('openai/gpt-oss')) {
    return process.env.GROQ_API_KEY || '';
  }
  return process.env.OPENAI_API_KEY || '';
}

/**
 * Get API endpoint based on model
 */
export function getApiEndpoint(model: string, apiKey?: string): string {
  if (model.startsWith('gemini')) {
    const key = apiKey || getApiKey(model);
    return `${GEMINI_API_ENDPOINT}/${model}:generateContent?key=${key}`;
  }
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('openai/gpt-oss')) {
    return GROQ_API_ENDPOINT;
  }
  return OPENAI_API_ENDPOINT;
}

/**
 * Check if model uses Gemini API
 */
export function isGeminiModel(model: string): boolean {
  return model.startsWith('gemini');
}

/**
 * Convert OpenAI-style messages to Gemini format
 */
export function convertToGeminiFormat(messages: Array<{ role: string; content: string }>): any {
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');
  const userContent = userMessages.map(m => m.content).join('\n\n');
  const fullContent = systemMessage ? `${systemMessage}\n\n${userContent}` : userContent;
  
  return {
    contents: [{
      parts: [{ text: fullContent }]
    }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json'
    }
  };
}

/**
 * Parse Gemini API response
 */
export function parseGeminiResponse(data: any): string {
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new ApiError('Invalid Gemini API response format', undefined, false);
}

// ============================================================================
// JSON PARSING WITH VALIDATION
// ============================================================================

/**
 * Check if JSON content appears to be truncated
 */
function isJsonTruncated(content: string): boolean {
  const trimmed = content.trim();
  
  // Quick checks for obvious truncation
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
    return true;
  }

  // Count brackets/braces to verify balance
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of trimmed) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;
  }

  // Unbalanced brackets/braces indicate truncation
  return braceCount !== 0 || bracketCount !== 0 || inString;
}

/**
 * Extract JSON from content (handles markdown code blocks)
 */
function extractJsonContent(content: string): string {
  const trimmed = content.trim();
  
  // Try to extract from markdown code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find JSON object/array boundaries
  const jsonMatch = trimmed.match(/^[\s\S]*?(\{[\s\S]*\}|\[[\s\S]*\])[\s\S]*?$/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  return trimmed;
}

/**
 * Parse JSON response with proper error handling
 * Exported for use in routes that need custom fetch logic
 */
export function parseJsonResponse(content: string): any {
  if (!content || typeof content !== 'string') {
    throw new JsonParseError('Empty or invalid response content', content || '', false);
  }

  const extracted = extractJsonContent(content);

  // Check for truncation before attempting parse
  if (isJsonTruncated(extracted)) {
    throw new TruncatedResponseError(extracted);
  }

  try {
    return JSON.parse(extracted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    throw new JsonParseError(
      `Failed to parse JSON: ${message}`,
      extracted.substring(0, 500),
      false // Parse errors on complete JSON are not retryable
    );
  }
}

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (0-25% of delay)
  return delay + Math.random() * delay * 0.25;
}

/**
 * Execute function with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const isRetryable = 
        (error instanceof TruncatedResponseError) ||
        (error instanceof ApiError && error.isRetryable) ||
        (error instanceof JsonParseError && error.isRetryable);

      if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
        break;
      }

      const delay = calculateBackoffDelay(attempt);
      console.log(
        `⚠️ [${context}] Attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1} failed: ${lastError.message}. ` +
        `Retrying in ${Math.round(delay)}ms...`
      );
      
      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================================================
// MAIN API CALL FUNCTION
// ============================================================================

export interface ApiCallOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
}

/**
 * Make API call with automatic format handling, retry logic, and fallback support
 */
export async function makeApiCall(
  model: string,
  systemPrompt: string,
  userContent: string,
  options: ApiCallOptions = {}
): Promise<any> {
  const { temperature = 0.4, maxTokens = 4000, responseFormat = 'json_object' } = options;

  return withRetry(async () => {
    const apiKey = getApiKey(model);
    const apiEndpoint = getApiEndpoint(model, apiKey);
    const isGemini = isGeminiModel(model);

    // Build request
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let requestBody: any;

    if (isGemini) {
      requestBody = {
        contents: [{
          parts: [{ text: `${systemPrompt}\n\n${userContent}` }]
        }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(responseFormat === 'json_object' && { responseMimeType: 'application/json' })
        }
      };
    } else {
      requestBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === 'json_object' && { response_format: { type: 'json_object' } })
      };
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Execute request
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || JSON.stringify(errorData);
      
      // Handle rate limiting with fallback
      if (response.status === 429 && isGemini) {
        const fallbackModel = MODEL_CONFIG.editExperienceFallback;
        if (fallbackModel && !fallbackModel.startsWith('gemini')) {
          console.log(`⚠️ Gemini rate limited (429), falling back to: ${fallbackModel}`);
          return makeApiCall(fallbackModel, systemPrompt, userContent, options);
        }
      }

      const isRetryable = response.status >= 500 || response.status === 429;
      throw new ApiError(
        `API error ${response.status}: ${errorMessage}`,
        response.status,
        isRetryable
      );
    }

    // Parse response
    const data = await response.json();
    let content: string;

    if (isGemini) {
      content = parseGeminiResponse(data);
    } else {
      if (!data.choices?.[0]?.message?.content) {
        throw new ApiError('Invalid response structure from API', undefined, false);
      }
      content = data.choices[0].message.content;
    }

    // Return parsed JSON or raw text
    return responseFormat === 'json_object' ? parseJsonResponse(content) : content;
  }, `makeApiCall(${model})`);
}
