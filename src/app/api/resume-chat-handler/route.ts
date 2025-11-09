import { NextRequest, NextResponse } from 'next/server';

/**
 * INTELLIGENT RESUME CHAT HANDLER
 * ================================
 * 
 * This endpoint analyzes user messages and determines the appropriate action:
 * 1. General questions → Answer directly
 * 2. Specific section edits → Call targeted agent
 * 3. New resume request → Call full coordinator
 * 
 * It creates a todo list and only makes requested changes.
 */

interface ChatRequest {
  message: string;
  profile: any;
  currentResume?: any;
  conversationHistory: Array<{ role: string; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const { message, profile, currentResume, conversationHistory } = await request.json();

    if (!message || !profile) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Analyze user intent using AI
    const intent = await analyzeUserIntent(message, currentResume, conversationHistory);

    console.log('📋 User Intent:', intent.type);
    console.log('📝 Todo List:', intent.todoList);

    // Route to appropriate handler based on intent
    switch (intent.type) {
      case 'general_question':
        return handleGeneralQuestion(message, profile, conversationHistory);
      
      case 'edit_summary':
        return handleEditSummary(message, profile, currentResume, intent);
      
      case 'edit_experience':
        return handleEditExperience(message, profile, currentResume, intent);
      
      case 'edit_project':
        return handleEditProject(message, profile, currentResume, intent);
      
      case 'edit_skills':
        return handleEditSkills(message, profile, currentResume, intent);
      
      case 'generate_new_resume':
        return handleGenerateNewResume(message, profile, intent);
      
      default:
        return handleGeneralResponse(message, profile, conversationHistory);
    }

  } catch (error) {
    console.error('Error in chat handler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function analyzeUserIntent(
  message: string, 
  currentResume: any, 
  conversationHistory: Array<{ role: string; content: string }>
) {
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are an Intent Analysis Agent for a resume assistant. Analyze the user's message and determine:
1. What type of action they want (question, edit, or new resume)
2. What specific changes they're requesting
3. Create a todo list of actions needed

INTENT TYPES:
- "general_question": User asking about resume tips, ATS, formatting, etc.
- "edit_summary": User wants to change the professional summary
- "edit_experience": User wants to modify a specific experience entry
- "edit_project": User wants to modify a specific project
- "edit_skills": User wants to add/remove/reorganize skills
- "generate_new_resume": User provides a new job description or wants a complete new resume

ANALYSIS RULES:
- If user mentions "job description", "new job", "apply for" → generate_new_resume
- If user says "change summary", "update summary", "rewrite summary" → edit_summary
- If user mentions specific company/role in experience → edit_experience
- If user mentions specific project name → edit_project
- If user asks "how to", "what is", "why" → general_question
- Default to general_question if unclear

Return JSON:
{
  "type": "intent_type",
  "confidence": 0.95,
  "todoList": [
    "Action item 1",
    "Action item 2"
  ],
  "targetSection": "section_name or null",
  "targetItem": "specific item identifier or null",
  "reasoning": "Brief explanation of why this intent was chosen"
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5), // Last 5 messages for context
        {
          role: 'user',
          content: `Analyze this message:

USER MESSAGE: "${message}"

HAS CURRENT RESUME: ${currentResume ? 'Yes' : 'No'}
${currentResume ? `CURRENT RESUME SECTIONS: ${Object.keys(currentResume).join(', ')}` : ''}

Determine the intent and create a todo list.`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function handleGeneralQuestion(
  message: string,
  profile: any,
  conversationHistory: Array<{ role: string; content: string }>
) {
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are a helpful resume assistant. Answer questions about:
- Resume best practices
- ATS optimization
- How to describe experience
- What to include/exclude
- Formatting tips
- Career advice

Be concise, helpful, and encouraging. Use emojis appropriately.`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  const data = await response.json();
  const answer = data.choices[0].message.content;

  return NextResponse.json({
    type: 'general_answer',
    message: answer,
    requiresAction: false
  });
}

async function handleEditSummary(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are a Summary Rewriting Agent. The user wants to modify their professional summary.

CURRENT SUMMARY:
${currentResume?.summary || 'No summary yet'}

USER REQUEST: "${message}"

TODO LIST:
${intent.todoList.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Rewrite the summary according to the user's request. Keep it:
- 3-4 powerful sentences
- Professional and compelling
- ATS-optimized
- Relevant to their profile

Return JSON:
{
  "newSummary": "The rewritten summary",
  "changes": ["Change 1", "Change 2"],
  "explanation": "Brief explanation of what you changed and why"
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Profile: ${JSON.stringify(profile, null, 2)}`
        }
      ],
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  return NextResponse.json({
    type: 'edit_summary',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      summary: result.newSummary
    },
    message: `✅ Summary updated!\n\n${result.explanation}\n\nChanges made:\n${result.changes.map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleEditExperience(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are an Experience Editing Agent. The user wants to modify a specific experience entry.

CURRENT EXPERIENCES:
${JSON.stringify(currentResume?.experience || [], null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${intent.todoList.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Identify which experience to modify and make the requested changes.

Return JSON:
{
  "targetExperienceIndex": 0,
  "updatedExperience": {
    "title": "...",
    "company": "...",
    "location": "...",
    "startDate": "...",
    "endDate": "...",
    "highlights": ["...", "..."]
  },
  "changes": ["Change 1", "Change 2"],
  "explanation": "What you changed and why"
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  // Update the specific experience
  const updatedExperiences = [...(currentResume?.experience || [])];
  updatedExperiences[result.targetExperienceIndex] = result.updatedExperience;

  return NextResponse.json({
    type: 'edit_experience',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      experience: updatedExperiences
    },
    message: `✅ Experience updated!\n\n${result.explanation}\n\nChanges made:\n${result.changes.map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleEditProject(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are a Project Editing Agent. The user wants to modify a specific project.

CURRENT PROJECTS:
${JSON.stringify(currentResume?.projects || [], null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${intent.todoList.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Identify which project to modify and make the requested changes.

Return JSON:
{
  "targetProjectIndex": 0,
  "updatedProject": {
    "title": "...",
    "startDate": "...",
    "endDate": "...",
    "technologies": "...",
    "highlights": ["...", "..."]
  },
  "changes": ["Change 1", "Change 2"],
  "explanation": "What you changed and why"
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  // Update the specific project
  const updatedProjects = [...(currentResume?.projects || [])];
  updatedProjects[result.targetProjectIndex] = result.updatedProject;

  return NextResponse.json({
    type: 'edit_project',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      projects: updatedProjects
    },
    message: `✅ Project updated!\n\n${result.explanation}\n\nChanges made:\n${result.changes.map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleEditSkills(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = `You are a Skills Editing Agent. The user wants to modify the skills section.

CURRENT SKILLS:
${JSON.stringify(currentResume?.skills || {}, null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${intent.todoList.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Make the requested changes to the skills section.

Return JSON:
{
  "updatedSkills": {
    "Technical Skills": ["skill1", "skill2"],
    "Programming Languages": ["lang1", "lang2"]
  },
  "changes": ["Change 1", "Change 2"],
  "explanation": "What you changed and why"
}`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  return NextResponse.json({
    type: 'edit_skills',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      skills: result.updatedSkills
    },
    message: `✅ Skills updated!\n\n${result.explanation}\n\nChanges made:\n${result.changes.map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleGenerateNewResume(
  message: string,
  profile: any,
  intent: any
) {
  return NextResponse.json({
    type: 'generate_new_resume',
    todoList: intent.todoList,
    message: `📋 I'll generate a new tailored resume for you!\n\nTodo List:\n${intent.todoList.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}\n\nStarting the 7-agent optimization process...`,
    requiresAction: true,
    action: 'trigger_coordinator'
  });
}

async function handleGeneralResponse(
  message: string,
  profile: any,
  conversationHistory: Array<{ role: string; content: string }>
) {
  return handleGeneralQuestion(message, profile, conversationHistory);
}

