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
  resumeParser: 'gemini-3-flash-preview', // Fast, accurate PDF parsing with large context
  editExperience: 'gemini-3-flash-preview',
  editProject: 'gemini-3-flash-preview',
  jobAnalyzer: 'gemini-3-flash-preview',
  profileMatcher: 'gemini-3-flash-preview',
  experienceOptimizer: 'gemini-3-flash-preview',
  projectOptimizer: 'gemini-3-flash-preview',
  skillsEnhancer: 'gemini-3-flash-preview',
  
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
  // Gemini models
  if (model.startsWith('gemini')) {
    return process.env.GEMINI_API_KEY || '';
  }
  // Groq models
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('openai/gpt-oss')) {
    return process.env.GROQ_API_KEY || '';
  }
  // OpenAI models (fallback)
  return process.env.OPENAI_API_KEY || '';
}

/**
 * Get API endpoint based on model
 */
export function getApiEndpoint(model: string, apiKey?: string): string {
  // Gemini models - API key goes in query parameter
  if (model.startsWith('gemini')) {
    const key = apiKey || getApiKey(model);
    return `${GEMINI_API_ENDPOINT}/${model}:generateContent?key=${key}`;
  }
  // Groq models
  if (model.startsWith('llama') || model.startsWith('mixtral') || model.startsWith('openai/gpt-oss')) {
    return GROQ_API_ENDPOINT;
  }
  // OpenAI models (fallback)
  return OPENAI_API_ENDPOINT;
}

/**
 * Check if model uses Gemini API (different request format)
 */
export function isGeminiModel(model: string): boolean {
  return model.startsWith('gemini');
}

/**
 * Convert OpenAI-style messages to Gemini format
 */
export function convertToGeminiFormat(messages: Array<{ role: string; content: string }>): any {
  // Gemini uses a different format - combine system and user messages
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');
  
  // Combine all user messages
  const userContent = userMessages.map(m => m.content).join('\n\n');
  
  // Gemini format: single content string with system instruction
  const fullContent = systemMessage ? `${systemMessage}\n\n${userContent}` : userContent;
  
  return {
    contents: [{
      parts: [{
        text: fullContent
      }]
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
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const content = data.candidates[0].content.parts[0].text;
    return content;
  }
  throw new Error('Invalid Gemini API response format');
}

/**
 * Make API call with automatic format handling for Gemini vs OpenAI/Groq
 */
export async function makeApiCall(
  model: string,
  systemPrompt: string,
  userContent: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json_object' | 'text';
  } = {}
): Promise<any> {
  const apiKey = getApiKey(model);
  const apiEndpoint = getApiEndpoint(model, apiKey);
  const isGemini = isGeminiModel(model);

  const { temperature = 0.4, maxTokens = 4000, responseFormat = 'json_object' } = options;

  // Prepare request body based on API type
  let requestBody: any;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isGemini) {
    // Gemini API format - API key is in URL query parameter, not header
    const fullContent = `${systemPrompt}\n\n${userContent}`;
    requestBody = {
      contents: [{
        parts: [{
          text: fullContent
        }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        ...(responseFormat === 'json_object' && { responseMimeType: 'application/json' })
      }
    };
    // Note: API key is already in the URL query parameter
  } else {
    // OpenAI/Groq format
    requestBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat === 'json_object' && { response_format: { type: "json_object" } })
    };
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || JSON.stringify(errorData);
    
    // Check if it's a Gemini quota error (429) and we have a fallback
    if (response.status === 429 && isGemini && model.includes('gemini')) {
      // Map Gemini models to their fallback Groq models
      const fallbackMap: Record<string, string> = {
        'gemini-3-flash-preview': MODEL_CONFIG.editExperienceFallback,
      };
      
      // Use the fallback model for this Gemini model, or default to editExperienceFallback
      const fallbackModel = fallbackMap[model] || MODEL_CONFIG.editExperienceFallback;
      
      if (fallbackModel && !fallbackModel.includes('gemini')) {
        console.log(`⚠️ Gemini quota exceeded (429), falling back to Groq model: ${fallbackModel}`);
        
        // Retry with fallback model (prevent infinite recursion)
        return makeApiCall(
          fallbackModel,
          systemPrompt,
          userContent,
          options
        );
      }
    }
    
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorMessage}`);
  }

  const data = await response.json();

  // Parse response based on API type
  if (isGemini) {
    const content = parseGeminiResponse(data);
    return responseFormat === 'json_object' ? JSON.parse(content) : content;
  } else {
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from API');
    }
    const content = data.choices[0].message.content;
    return responseFormat === 'json_object' ? JSON.parse(content) : content;
  }
}

