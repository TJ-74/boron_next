import { NextRequest, NextResponse } from 'next/server';
import { MODEL_CONFIG, makeApiCall, getApiEndpoint, getApiKey } from '../config/models';

/**
 * Build a resume from user's profile data
 */
function buildResumeFromProfile(profile: any) {
  if (!profile) return null;

  // Build header from profile info
  const header = {
    name: profile.name || 'Your Name',
    title: profile.title || '',
    contact: {
      email: profile.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      linkedin: profile.linkedinUrl || '',
      github: profile.githubUrl || '',
      portfolio: profile.portfolioUrl || ''
    }
  };

  // Build summary from about section
  const summary = profile.about || '';

  // Build experience from profile experiences
  const experience = (profile.experiences || [])
    .filter((exp: any) => exp.includeInResume !== false)
    .sort((a: any, b: any) => (b.order || 0) - (a.order || 0))
    .map((exp: any) => ({
      title: exp.position || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      highlights: exp.description ? exp.description.split('\n').filter((line: string) => line.trim()) : []
    }));

  // Build projects from profile projects
  const projects = (profile.projects || [])
    .filter((proj: any) => proj.includeInResume !== false)
    .map((proj: any) => ({
      title: proj.title || '',
      startDate: proj.startDate || '',
      endDate: proj.endDate || '',
      technologies: proj.technologies || '',
      highlights: proj.description ? proj.description.split('\n').filter((line: string) => line.trim()) : [],
      url: proj.projectUrl || proj.githubUrl || ''
    }));

  // Build skills from profile skills
  const skillsByDomain: { [key: string]: string[] } = {};
  (profile.skills || [])
    .filter((skill: any) => skill.includeInResume !== false)
    .forEach((skill: any) => {
      const domain = skill.domain || 'Other Skills';
      if (!skillsByDomain[domain]) {
        skillsByDomain[domain] = [];
      }
      skillsByDomain[domain].push(skill.name);
    });

  // Build education from profile education
  const education = (profile.education || [])
    .filter((edu: any) => edu.includeInResume !== false)
    .map((edu: any) => ({
      school: edu.school || '',
      degree: edu.degree || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.cgpa || ''
    }));

  // Build certificates from profile certificates
  const certificates = (profile.certificates || [])
    .filter((cert: any) => cert.includeInResume !== false)
    .map((cert: any) => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.issueDate || '',
      url: cert.credentialUrl || ''
    }));

  // Only return a resume if we have at least some data
  if (!header.name || header.name === 'Your Name') {
    return null;
  }

  return {
    header,
    summary,
    skills: skillsByDomain,
    experience,
    projects,
    education,
    certificates
  };
}

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
 * 
 * COST-OPTIMIZED: Uses tiered model strategy to minimize costs while maintaining quality.
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

    // If no currentResume is provided, try to fetch from database
    let resumeData = currentResume;
    if (!resumeData && profile?.uid) {
      try {
        const baseUrl = request.nextUrl.origin;
        const response = await fetch(`${baseUrl}/api/resume-save?uid=${profile.uid}`);
        
        if (response.ok) {
          const { data } = await response.json();
          if (data?.resumeData) {
            resumeData = data.resumeData;
            console.log('✅ Loaded resume from database for user:', profile.uid);
          }
        }
      } catch (error) {
        console.log('ℹ️ No saved resume found in database, starting fresh');
      }
    }

    // Analyze user intent using AI
    const intent = await analyzeUserIntent(message, resumeData, conversationHistory);

    console.log('📋 User Intent:', intent.type);
    console.log('📝 Todo List:', intent.todoList);

    // Route to appropriate handler based on intent
    switch (intent.type) {
      case 'general_question':
        return handleGeneralQuestion(message, profile, resumeData, conversationHistory);
      
      case 'edit_summary':
        return handleEditSummary(message, profile, resumeData, intent);
      
      case 'edit_experience':
        return handleEditExperience(message, profile, resumeData, intent);
      
      case 'edit_project':
        return handleEditProject(message, profile, resumeData, intent);
      
      case 'edit_skills':
        return handleEditSkills(message, profile, resumeData, intent);
      
      case 'edit_education':
        return handleEditEducation(message, profile, resumeData, intent);
      
      case 'generate_new_resume':
        return handleGenerateNewResume(message, profile, resumeData, intent);
      
      default:
        return handleGeneralResponse(message, profile, resumeData, conversationHistory);
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
  const model = MODEL_CONFIG.intentAnalysis;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);

  const systemPrompt = `You are an Intent Analysis Agent for a resume assistant. Analyze the user's message and determine:
1. What type of action they want (question, edit, or new resume)
2. What specific changes they're requesting
3. Create a todo list of actions needed

INTENT TYPES:
- "general_question": User asking questions about:
  * Their current resume content (e.g., "What projects do I have?", "What's my experience?", "Tell me about my skills")
  * General resume tips, ATS, formatting, career advice
  * Questions that don't require editing the resume
- "edit_summary": User wants to change the professional summary
- "edit_experience": User wants to modify a specific experience entry
- "edit_project": User wants to modify a specific project
- "edit_skills": User wants to add/remove/reorganize skills
- "edit_education": User wants to modify education entries
- "generate_new_resume": User provides a new job description or wants a complete new resume

ANALYSIS RULES:
- If user mentions "job description", "new job", "apply for" → generate_new_resume
- If user says "change", "update", "modify", "edit", "rewrite", "add", "remove", "reorganize" → appropriate edit intent
- If user asks "what", "tell me", "show me", "list", "do I have" about their resume → general_question
- If user asks "how to", "what is", "why" about general topics → general_question
- If user mentions specific company/role in experience with edit intent → edit_experience
- If user mentions specific project name with edit intent → edit_project
- If user mentions "education", "degree", "university", "college", "school" with edit intent → edit_education
- Default to general_question if unclear or if it's a question about resume content

AUTONOMOUS REQUEST DETECTION:
- If user says "generate", "random", "make up", "sample", "demo", "create", "fill in" details
  → Mark in todoList as "with GENERATED/RANDOM/SAMPLE details"
- This signals downstream agents to be autonomous instead of asking for clarification
- Examples:
  * "Add project X with random details" → Todo: "Add project X with RANDOM details"
  * "Create sample experience" → Todo: "Create SAMPLE experience"
  * "Make up some details for Y" → Todo: "Add Y with GENERATED details"

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
      model: MODEL_CONFIG.intentAnalysis,
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid response format from API');
  }

  return JSON.parse(data.choices[0].message.content);
}

async function handleGeneralQuestion(
  message: string,
  profile: any,
  currentResume: any,
  conversationHistory: Array<{ role: string; content: string }>
) {
  const model = MODEL_CONFIG.generalQuestions;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);

  const systemPrompt = `You are a helpful resume assistant. You can answer questions about:
1. THE USER'S CURRENT RESUME CONTENT:
   - What projects, experiences, skills, education they have
   - Details about specific entries in their resume
   - Summary of their resume sections
   - Analysis of their resume content
   
2. GENERAL RESUME ADVICE:
   - Resume best practices
   - ATS optimization
   - How to describe experience
   - What to include/exclude
   - Formatting tips
   - Career advice

CURRENT RESUME DATA:
${currentResume ? JSON.stringify(currentResume, null, 2) : 'No resume data available yet.'}

When answering questions about the user's resume:
- Reference specific details from the resume data above
- Be accurate and specific
- If asking about something not in the resume, let them know it's not currently in their resume
- You can suggest improvements or additions if relevant

When answering general resume questions:
- Provide helpful, actionable advice
- Be concise, helpful, and encouraging
- Use emojis appropriately

FORMATTING RULES:
- NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
- Keep punctuation simple and professional

Be conversational and helpful!`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL_CONFIG.generalQuestions,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-5),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid response format from API');
  }

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
  const model = MODEL_CONFIG.editSummary;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);

  const systemPrompt = `You are a Summary Rewriting Agent. The user wants to modify their professional summary.

CURRENT SUMMARY:
${currentResume?.summary || 'No summary yet'}

USER REQUEST: "${message}"

TODO LIST:
${(intent?.todoList || []).map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Rewrite the summary according to the user's request. Keep it:
- 3-4 powerful sentences
- Professional and compelling
- ATS-optimized
- Relevant to their profile
- IMPORTANT: Bold important words using markdown (**text**) such as:
  * Key skills and technologies
  * Quantifiable achievements and metrics
  * Industry-specific terms
  * Action verbs and impactful nouns
  * Years of experience or notable accomplishments
- NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
- Keep punctuation simple and professional

Return JSON:
{
  "newSummary": "The rewritten summary with **bolded** important words",
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
      model: MODEL_CONFIG.editSummary,
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid response format from API');
  }

  const result = JSON.parse(data.choices[0].message.content);

  return NextResponse.json({
    type: 'edit_summary',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      summary: result.newSummary
    },
    message: `✅ Summary updated!\n\n${result.explanation || ''}\n\nChanges made:\n${(result.changes || []).map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleEditExperience(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  // Get current experiences (allow empty array for adding new experiences)
  const experiences = currentResume?.experience || [];

  const model = MODEL_CONFIG.editExperience;

  const systemPrompt = `You are an Experience Editing Agent. The user wants to modify or add an experience entry.

CURRENT EXPERIENCES:
${JSON.stringify(experiences, null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${(intent?.todoList || []).map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

DETECTION: Check if TODO LIST or USER REQUEST contains keywords like "GENERATED", "RANDOM", "SAMPLE", "make up" - this means user wants autonomous mode.

CRITICAL RULES:

1. **AUTONOMOUS MODE** - Activate when user explicitly requests:
   - Keywords: "generate", "random", "make up", "sample", "demo", "create", "fill in"
   - Phrases: "with details", "add details", "complete it", "make something up"
   - Action: CREATE complete, realistic experience details based on the role and context
   
2. **INFERENCE MODE** - Use when user provides partial details:
   - Job title + company → Infer typical responsibilities and tech stack
   - Role type → Generate industry-standard achievements
   - Action: Fill in reasonable details based on context
   
3. **CLARIFICATION MODE** - Activate when:
   - User provides minimal info with NO generation instruction
   - Cannot reasonably infer critical details
   - Action: Ask specific questions

4. **AUTONOMOUS MODE GUIDELINES**:
   - Infer appropriate tech stack from job title and company
   - Create realistic date ranges (6 months to 3 years typical)
   - Generate 3-5 relevant highlights with realistic metrics (10-40% improvements typical)
   - Use industry-standard practices for the role/company
   - Be creative but professional and believable

5. **ROLE-BASED INFERENCE**:
   - "Software Engineer" → Languages (Python/Java/JavaScript), frameworks, version control
   - "Data Scientist" → Python, pandas, ML models, SQL, data visualization
   - "Product Manager" → Agile, stakeholder management, roadmap planning
   - "Frontend Developer" → React/Vue/Angular, TypeScript, responsive design
   - "Backend Developer" → APIs, databases, microservices, cloud platforms
   - "DevOps Engineer" → CI/CD, Docker, Kubernetes, cloud infrastructure
   - Adapt based on company (e.g., Microsoft → C#/.NET/Azure, Google → Go/GCP)

EXAMPLES:

User: "Add experience as Software Engineer at Microsoft with random details"
→ AUTONOMOUS: Generate with C#, .NET, Azure, TypeScript, team collaboration

User: "Add Data Scientist role at startup, make up some details"
→ AUTONOMOUS: Generate with Python, ML, pandas, business impact metrics

User: "Add Backend Developer at Amazon from 2021-2023"
→ INFERENCE: Generate with AWS, Java/Python, microservices, scale achievements

User: "Add my internship at Tesla"
→ CLARIFICATION: Ask for role, dates, responsibilities

User: "Create a sample experience for Frontend Developer"
→ AUTONOMOUS: Generate with React, TypeScript, modern frontend stack

IMPORTANT FORMATTING:
- Bold important words in highlights using markdown (**text**) such as:
  * Technologies, tools, and frameworks
  * Quantifiable metrics (numbers, percentages, dollar amounts)
  * Key achievements and results
  * Industry-specific terms
  * Action verbs and impactful nouns
- NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
- Keep punctuation simple and professional

If you have ALL the information needed, return JSON (can be a single object OR an array for multiple updates):
{
  "targetExperienceIndex": 0 (or null if adding new),
  "updatedExperience": {
    "title": "actual job title",
    "company": "actual company name",
    "location": "actual location",
    "startDate": "actual date",
    "endDate": "actual date",
    "highlights": ["Actual bullet point with **bolded** important words", "..."]
  },
  "changes": ["Change 1", "Change 2"],
  "explanation": "What you changed and why"
}

If you need MORE information, return JSON:
{
  "needsClarification": true,
  "question": "I'd be happy to add a new experience! Could you please provide:\n- Job title\n- Company name\n- Start and end dates\n- Location (optional)\n- Key responsibilities and achievements\n\nOr, I can generate realistic sample details if you'd like - just say 'generate random details'!"
}

OR for multiple updates/deletions, return an array:
[
  {
    "targetExperienceIndex": 0,
    "action": "update",
    "updatedExperience": {...},
    "changes": ["Change 1"],
    "explanation": "..."
  },
  {
    "targetExperienceIndex": 1,
    "action": "delete",
    "changes": ["Change 2"],
    "explanation": "..."
  }
]

IMPORTANT:
- If user wants to DELETE an experience, set "action": "delete" and omit "updatedExperience"
- If user wants to UPDATE an experience, set "action": "update" and provide "updatedExperience"
- If multiple experiences need changes, return an array
- Process deletions in reverse order (highest index first) to avoid index shifting issues`;

  const userContent = `Please analyze the current experiences and user request, then return the updated experience in the specified JSON format.`;

  let result;
  try {
    result = await makeApiCall(
      model,
      systemPrompt,
      userContent,
      {
        temperature: 0.4,
        maxTokens: 1000,
        responseFormat: 'json_object'
      }
    );
  } catch (error) {
    console.error('❌ Error calling API:', error);
    throw new Error(`Failed to call API: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Log the result for debugging
  console.log('🔍 API Response:', JSON.stringify(result, null, 2));

  // Validate result exists
  if (!result || typeof result !== 'object') {
    throw new Error(`Invalid response from API: expected object, got ${typeof result}. Response: ${JSON.stringify(result)}`);
  }

  // Check if AI needs clarification (handle both single object and array)
  const firstResult = Array.isArray(result) ? result[0] : result;
  if (firstResult?.needsClarification === true && firstResult?.question) {
    // Return a general question response instead of updating
    return NextResponse.json({
      type: 'general_answer',
      message: firstResult.question,
      requiresAction: false
    });
  }

  // Check for placeholder values in the result
  const checkForPlaceholders = (update: any): boolean => {
    if (!update.updatedExperience) return false;
    const exp = update.updatedExperience;
    return (
      exp.title?.toLowerCase().includes('job title') ||
      exp.title?.toLowerCase().includes('position') && exp.title.length < 15 ||
      exp.company?.toLowerCase().includes('company name') ||
      exp.company?.toLowerCase().includes('company') && exp.company.length < 15 ||
      exp.startDate?.toLowerCase().includes('start date') ||
      exp.endDate?.toLowerCase().includes('end date')
    );
  };

  const updates = Array.isArray(result) ? result : [result];
  if (updates.some(checkForPlaceholders)) {
    // Return a question asking for the missing information
    return NextResponse.json({
      type: 'general_answer',
      message: "I'd be happy to help you add an experience! However, I need more details to create it properly. Could you please provide:\n\n• Job title\n• Company name\n• Start and end dates (or \"Present\" if current)\n• Location (optional)\n• Key responsibilities and achievements\n\nOnce you provide these details, I'll add the experience to your resume!",
      requiresAction: false
    });
  }

  // Normalize result to array format
  
  // Update the specific experience(s)
  const updatedExperiences = [...experiences];
  const allChanges: string[] = [];
  const allExplanations: string[] = [];
  
  // Separate deletions and updates
  const deletions: Array<{ index: number; explanation: string; changes: string[] }> = [];
  const updatesToApply: Array<{ index: number; experience: any; explanation: string; changes: string[] }> = [];
  
  // Validate all updates first
  for (const update of updates) {
    // If targetExperienceIndex is null, it means adding a new experience
    if (update.targetExperienceIndex === null && update.updatedExperience) {
      // Add new experience
      updatedExperiences.push(update.updatedExperience);
      allChanges.push(...(update.changes || ['Experience added']));
      allExplanations.push(update.explanation || 'Experience added');
      continue;
    }
    
    if (update.targetExperienceIndex === undefined) {
      throw new Error(`Invalid response from API: missing targetExperienceIndex in update. Full response: ${JSON.stringify(result, null, 2)}`);
    }
    
    const index = update.targetExperienceIndex;
    if (index < 0 || index >= updatedExperiences.length) {
      throw new Error(`Invalid experience index: ${index}. Available indices: 0-${updatedExperiences.length - 1}`);
    }
    
    // Determine action - check explicit action field or infer from explanation
    let action = update.action;
    if (!action) {
      // Infer action from explanation if available
      const explanation = (update.explanation || '').toLowerCase();
      if (explanation.includes('removed') || explanation.includes('deleted') || explanation.includes('remove') || explanation.includes('delete')) {
        // If explanation says removed/deleted, treat as deletion even if updatedExperience is provided
        action = 'delete';
      } else {
        action = 'update';
      }
    }
    
    if (action === 'delete') {
      deletions.push({
        index,
        explanation: update.explanation || 'Experience deleted',
        changes: update.changes || ['Experience removed']
      });
    } else {
      if (update.updatedExperience === undefined) {
        throw new Error(`Invalid response from API: missing updatedExperience for update at index ${index}. Full response: ${JSON.stringify(result, null, 2)}`);
      }
      updatesToApply.push({
        index,
        experience: update.updatedExperience,
        explanation: update.explanation || 'Experience updated',
        changes: update.changes || ['Experience modified']
      });
    }
  }
  
  // Apply deletions first (in reverse order to avoid index shifting)
  deletions.sort((a, b) => b.index - a.index);
  for (const deletion of deletions) {
    updatedExperiences.splice(deletion.index, 1);
    allChanges.push(...deletion.changes);
    allExplanations.push(deletion.explanation);
  }
  
  // Apply updates (need to adjust indices if deletions occurred before them)
  for (const update of updatesToApply) {
    // Adjust index if deletions occurred before this index
    const adjustedIndex = update.index - deletions.filter(d => d.index < update.index).length;
    if (adjustedIndex >= 0 && adjustedIndex < updatedExperiences.length) {
      updatedExperiences[adjustedIndex] = update.experience;
      allChanges.push(...update.changes);
      allExplanations.push(update.explanation);
    }
  }

  const combinedExplanation = allExplanations.length > 0 
    ? allExplanations.join('\n\n') 
    : 'Experience entries updated';
  
  const uniqueChanges = [...new Set(allChanges)];
  const changesText = uniqueChanges.length > 0
    ? uniqueChanges.map((c: string) => `• ${c}`).join('\n')
    : '• Experience modified';

  return NextResponse.json({
    type: 'edit_experience',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      experience: updatedExperiences
    },
    message: `✅ Experience updated!\n\n${combinedExplanation}\n\nChanges made:\n${changesText}`,
    requiresAction: true
  });
}

async function handleEditProject(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  // Get current projects (allow empty array for adding new projects)
  const projects = currentResume?.projects || [];

  const model = MODEL_CONFIG.editProject;

  const systemPrompt = `You are a Project Editing Agent. The user wants to modify or add a project.

CURRENT PROJECTS:
${JSON.stringify(projects, null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${(intent?.todoList || []).map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

DETECTION: Check if TODO LIST or USER REQUEST contains keywords like "GENERATED", "RANDOM", "SAMPLE", "make up" - this means user wants autonomous mode.

CRITICAL RULES:

1. **AUTONOMOUS MODE** - Activate when user explicitly requests:
   - Keywords: "generate", "random", "make up", "sample", "demo", "create", "fill in"
   - Phrases: "with details", "add details", "complete it", "make something up"
   - Action: CREATE complete, realistic project details based on the title and context
   
2. **CLARIFICATION MODE** - Activate when:
   - User provides only a title with NO generation instruction
   - Information is missing AND user didn't ask you to generate
   - Action: Ask specific questions about what's needed

3. **AUTONOMOUS MODE GUIDELINES**:
   - Infer appropriate technologies from the project title/type
   - Create realistic date ranges (recent 3-12 months, or specify timeframe if mentioned)
   - Generate 2-3 relevant highlights with realistic metrics (70-95% accuracy, 20-40% improvements)
   - Use industry-standard tech stacks matching the project domain
   - Be creative but professional and believable

4. **TECHNOLOGY INFERENCE**:
   - "Weather" / "API" → Python, OpenWeatherAPI, Flask, REST API
   - "AI" / "ML" / "Bot" → Python, Machine Learning, TensorFlow, NLP, Neural Networks
   - "Web App" → React, Node.js, MongoDB, REST API, TypeScript
   - "Mobile" → React Native, Firebase, Redux, TypeScript
   - "Data" / "Analytics" → Python, SQL, pandas, Data Visualization
   - "Blockchain" → Solidity, Web3.js, Ethereum, Smart Contracts
   - Adapt based on context and project name

EXAMPLES:

User: "Add project 'PM AI Weather bot' with random details"
→ AUTONOMOUS: Generate with Python, OpenWeatherAPI, Machine Learning, Flask

User: "Add new project 'ML Classifier' and make up some details"  
→ AUTONOMOUS: Generate with Python, TensorFlow, scikit-learn, accuracy metrics

User: "Add project 'E-commerce Platform'"
→ CLARIFICATION: Ask for dates, technologies, highlights

User: "Create a sample project called 'Task Manager App'"
→ AUTONOMOUS: Generate with React, Node.js, MongoDB, REST API

IMPORTANT FORMATTING:
- Bold important words in highlights using markdown (**text**) such as:
  * Technologies, tools, and frameworks
  * Quantifiable metrics (numbers, percentages, scale)
  * Key features and accomplishments
  * Technical concepts and methodologies
  * Action verbs and impactful nouns
- NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
- Keep punctuation simple and professional

If you have ALL the information needed, return JSON (can be a single object OR an array for multiple updates):
{
  "targetProjectIndex": 0 (or null if adding new),
  "updatedProject": {
    "title": "actual project title",
    "startDate": "actual date",
    "endDate": "actual date",
    "technologies": "actual technologies",
    "highlights": ["Actual bullet point with **bolded** important words", "..."]
  },
  "changes": ["Change 1", "Change 2"],
  "explanation": "What you changed and why"
}

OR for multiple updates, return an array:
[
  {
    "targetProjectIndex": null,
    "updatedProject": {...},
    "changes": ["Change 1"],
    "explanation": "..."
  },
  {
    "targetProjectIndex": 1,
    "updatedProject": {...},
    "changes": ["Change 2"],
    "explanation": "..."
  }
]

If you need MORE information, return JSON:
{
  "needsClarification": true,
  "question": "I'd be happy to add a new project! Could you please provide:\n- The project title\n- Start and end dates\n- Technologies used\n- Key highlights or achievements\n\nOr, I can generate realistic sample details if you'd like - just say 'generate random details'!"
}`;

  const userContent = `Please analyze the current projects and user request, then return the updated project in the specified JSON format.`;

  let result;
  try {
    result = await makeApiCall(
      model,
      systemPrompt,
      userContent,
      {
        temperature: 0.4,
        maxTokens: 1000,
        responseFormat: 'json_object'
      }
    );
  } catch (error) {
    console.error('❌ Error calling API:', error);
    throw new Error(`Failed to call API: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Log the result for debugging
  console.log('🔍 API Response:', JSON.stringify(result, null, 2));

  // Validate result exists
  if (!result || typeof result !== 'object') {
    throw new Error(`Invalid response from API: expected object, got ${typeof result}. Response: ${JSON.stringify(result)}`);
  }

  // Check if AI needs clarification
  if (result.needsClarification === true && result.question) {
    // Return a general question response instead of updating
    return NextResponse.json({
      type: 'general_answer',
      message: result.question,
      requiresAction: false
    });
  }

  // Normalize result to array (handle both single object and array responses)
  const updates = Array.isArray(result) ? result : [result];
  
  // Check for OBVIOUS placeholder values that indicate the AI failed to generate
  const checkForObviousPlaceholders = (update: any): boolean => {
    if (!update.updatedProject) return false;
    const proj = update.updatedProject;
    return (
      proj.title?.toLowerCase() === 'new project title' ||
      proj.title?.toLowerCase() === 'project title' ||
      proj.title?.toLowerCase() === 'placeholder' ||
      proj.startDate?.toLowerCase() === 'start date' ||
      proj.endDate?.toLowerCase() === 'end date' ||
      proj.technologies?.toLowerCase() === 'list of technologies' ||
      proj.technologies?.toLowerCase() === 'technologies'
    );
  };

  if (updates.some(checkForObviousPlaceholders)) {
    // Return a question asking for the missing information
    return NextResponse.json({
      type: 'general_answer',
      message: "I'd be happy to help you add a project! However, I need more details to create it properly. Could you please provide:\n\n• The project title\n• Start and end dates (or \"Present\" if ongoing)\n• Technologies, tools, or frameworks used\n• Key highlights, achievements, or responsibilities\n\nOr, I can generate realistic sample details if you'd like - just say 'generate random details'!",
      requiresAction: false
    });
  }

  // Update the projects
  const updatedProjects = [...projects];
  const allChanges: string[] = [];
  const allExplanations: string[] = [];
  
  // Process each update
  for (const update of updates) {
    // Validate update structure
    if (update.targetProjectIndex === undefined || update.updatedProject === undefined) {
      // If targetProjectIndex is null, it means adding a new project
      if (update.targetProjectIndex === null && update.updatedProject) {
        // Add new project
        updatedProjects.push(update.updatedProject);
        allChanges.push(...(update.changes || ['Project added']));
        allExplanations.push(update.explanation || 'Project added');
      } else {
        const receivedKeys = Object.keys(update || {});
        throw new Error(
          `Invalid response from API: missing targetProjectIndex or updatedProject. ` +
          `Received keys: ${receivedKeys.join(', ')}. ` +
          `Full response: ${JSON.stringify(update, null, 2)}`
        );
      }
    } else {
      // Validate index for updates
      if (update.targetProjectIndex < 0 || update.targetProjectIndex >= updatedProjects.length) {
        throw new Error(`Invalid project index: ${update.targetProjectIndex}. Available indices: 0-${updatedProjects.length - 1}`);
      }
      
      updatedProjects[update.targetProjectIndex] = update.updatedProject;
      allChanges.push(...(update.changes || ['Project modified']));
      allExplanations.push(update.explanation || 'Project updated');
    }
  }

  const combinedExplanation = allExplanations.length > 0 
    ? allExplanations.join('\n\n') 
    : 'Project updated';
  
  const uniqueChanges = [...new Set(allChanges)];
  const changesText = uniqueChanges.length > 0
    ? uniqueChanges.map((c: string) => `• ${c}`).join('\n')
    : '• Project modified';

  return NextResponse.json({
    type: 'edit_project',
    todoList: intent.todoList,
    result: updates,
    updatedResume: {
      ...currentResume,
      projects: updatedProjects
    },
    message: `✅ Project updated!\n\n${combinedExplanation}\n\nChanges made:\n${changesText}`,
    requiresAction: true
  });
}

async function handleEditSkills(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const model = MODEL_CONFIG.editSkills;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);

  const systemPrompt = `You are a Skills Editing Agent. The user wants to modify the skills section.

CURRENT SKILLS:
${JSON.stringify(currentResume?.skills || {}, null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${(intent?.todoList || []).map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Make the requested changes to the skills section.

FORMATTING RULES:
- Use clear, concise skill names
- NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
- Keep punctuation simple and professional

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
      model: MODEL_CONFIG.editSkills,
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid response format from API');
  }

  const result = JSON.parse(data.choices[0].message.content);

  return NextResponse.json({
    type: 'edit_skills',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      skills: result.updatedSkills
    },
    message: `✅ Skills updated!\n\n${result.explanation || ''}\n\nChanges made:\n${(result.changes || []).map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleEditEducation(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const model = MODEL_CONFIG.editEducation;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);

  const systemPrompt = `You are an Education Editing Agent. The user wants to modify education entries.

CURRENT EDUCATION:
${JSON.stringify(currentResume?.education || [], null, 2)}

USER REQUEST: "${message}"

TODO LIST:
${(intent?.todoList || []).map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}

Identify which education entry to modify and make the requested changes.

Return JSON:
{
  "targetEducationIndex": 0,
  "action": "update" or "delete",
  "updatedEducation": {
    "degree": "...",
    "field": "...",
    "school": "...",
    "location": "...",
    "startDate": "...",
    "endDate": "...",
    "gpa": "...",
    "honors": ["...", "..."]
  },
  "changes": ["Change 1", "Change 2"],
  "explanation": "What you changed and why"
}

IMPORTANT:
- If user wants to DELETE an education entry, set "action": "delete" and omit "updatedEducation"
- If user wants to UPDATE an education entry, set "action": "update" and provide "updatedEducation"
- Always preserve existing values for fields not being changed (don't set them to null)
- Ensure "school" and "degree" are always provided (never null)
- NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
- Keep punctuation simple and professional`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL_CONFIG.editEducation,
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid response format from Groq API');
  }

  const result = JSON.parse(data.choices[0].message.content);

  // Handle education update or deletion
  const updatedEducation = [...(currentResume?.education || [])];
  
  // Validate targetEducationIndex
  if (result.targetEducationIndex < 0 || result.targetEducationIndex >= updatedEducation.length) {
    throw new Error(`Invalid education index: ${result.targetEducationIndex}. Available indices: 0-${updatedEducation.length - 1}`);
  }

  // Handle deletion
  if (result.action === 'delete') {
    updatedEducation.splice(result.targetEducationIndex, 1);
  } else {
    // Handle update - merge with existing to preserve non-null values
    const existingEducation = updatedEducation[result.targetEducationIndex];
    const mergedEducation = {
      ...existingEducation,
      ...result.updatedEducation,
      // Ensure required fields are not null
      school: result.updatedEducation?.school || existingEducation?.school || '',
      degree: result.updatedEducation?.degree || existingEducation?.degree || '',
      startDate: result.updatedEducation?.startDate || existingEducation?.startDate || '',
      endDate: result.updatedEducation?.endDate || existingEducation?.endDate || 'Present',
    };

    updatedEducation[result.targetEducationIndex] = mergedEducation;
  }

  // Filter out any invalid entries before returning
  const validEducation = updatedEducation.filter(edu => edu && (edu.school || edu.degree));

  return NextResponse.json({
    type: 'edit_education',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      education: validEducation
    },
    message: `✅ Education updated!\n\n${result.explanation || ''}\n\nChanges made:\n${(result.changes || []).map((c: string) => `• ${c}`).join('\n')}`,
    requiresAction: true
  });
}

async function handleGenerateNewResume(
  message: string,
  profile: any,
  currentResume: any,
  intent: any
) {
  const model = MODEL_CONFIG.jdOptimization;
  const apiEndpoint = getApiEndpoint(model);
  const apiKey = getApiKey(model);

  // Extract job description from message
  // The message should contain the JD, possibly with some user text before/after
  const jobDescription = message;

  if (!currentResume) {
    // No saved resume - build one from user's profile data
    const generatedResume = buildResumeFromProfile(profile);
    
    if (generatedResume) {
      // Successfully built resume from profile
      return NextResponse.json({
        type: 'generate_new_resume',
        updatedResume: generatedResume,
        message: `✅ I've created a resume from your profile data!

Your resume includes:
${generatedResume.experience?.length > 0 ? `• ${generatedResume.experience.length} work experience(s)` : ''}
${generatedResume.projects?.length > 0 ? `• ${generatedResume.projects.length} project(s)` : ''}
${generatedResume.education?.length > 0 ? `• ${generatedResume.education.length} education entry(ies)` : ''}
${generatedResume.skills ? `• Skills organized by category` : ''}

Now you can:
📝 Ask me to edit any section (e.g., "update my summary", "add a project")
🎯 Paste a job description to optimize for ATS
✨ Add more details with "generate random details"

The resume canvas is now open - check it out! What would you like to do next?`,
        requiresAction: true
      });
    } else {
      // No profile data available - guide them
      return NextResponse.json({
        type: 'general_answer',
        message: `👋 Welcome! I don't have enough information to create your resume yet.

Please set up your profile first by visiting your profile page, or you can start by telling me:
• "Add my experience as [Job Title] at [Company] with random details"
• "Add project '[Project Name]' and make up details"
• "Add my skills: [skill1, skill2, skill3]"

I can generate realistic professional details for you - just use keywords like "random details", "generate", or "make up"!

What would you like to add first?`,
        requiresAction: false
      });
    }
  }

  const systemPrompt = `You are a resume generation expert specializing in ATS optimization. Your task is to optimize an existing resume to match a job description while maintaining authenticity and keeping it concise.

CURRENT RESUME:
${JSON.stringify(currentResume, null, 2)}

JOB DESCRIPTION:
${jobDescription}

CRITICAL INSTRUCTIONS:

1. ATS OPTIMIZATION (Target: 90+ ATS Score):
   - Extract ALL keywords, skills, technologies, and terminology from the job description
   - Incorporate missing keywords ORGANICALLY into existing experience and project descriptions
   - Use exact terminology as it appears in the job description
   - Match required skills and experience levels mentioned in JD
   - Ensure all JD requirements (experience, skills) are reflected in the resume

2. MODIFICATION RULES:
   - ONLY modify existing experience and project sections - DO NOT add new ones
   - DO NOT create new experience entries or project entries
   - Modify existing bullet points to incorporate JD keywords naturally
   - Remove bullet points that are NOT relevant to the job description
   - Keep only the most relevant and impactful points

3. AUTHENTICITY REQUIREMENTS:
   - Stay TRUE to the candidate's actual experience - DO NOT bluff or fabricate
   - Only enhance and reframe existing achievements to match JD requirements
   - Maintain genuine descriptions that recruiters will find credible
   - If a skill/technology from JD doesn't exist in the resume, don't add it unless it can be reasonably inferred from existing work

4. CONCISENESS:
   - Keep the resume SHORT and focused
   - Recruiters have limited time - prioritize quality over quantity
   - Remove redundant or less impactful bullet points
   - Aim for 3-5 bullet points per experience/project (maximum)
   - Keep summary to 3-4 sentences

5. FORMATTING:
   - Bold important words using markdown (**text**) such as:
     * Technologies, tools, and frameworks from JD
     * Quantifiable metrics (numbers, percentages, dollar amounts)
     * Key achievements and results
     * Industry-specific terms from JD
     * Action verbs and impactful nouns
   - NEVER use em dashes (—). Use hyphens (-), commas, or parentheses instead
   - Keep punctuation simple and professional

6. SECTION-SPECIFIC GUIDELINES:
   - Summary: Rewrite to incorporate JD keywords and requirements organically
   - Experience: Modify existing entries only, enhance with JD keywords, remove irrelevant points
   - Projects: Modify existing entries only, enhance with JD keywords, remove irrelevant points
   - Skills: Update to include JD-relevant skills (only if they exist in candidate's background)
   - Education: Keep as-is unless specifically mentioned in JD requirements

Return JSON:
{
  "summary": "Optimized summary with JD keywords, 3-4 sentences with **bolded** important terms",
  "skills": {
    "category": ["skill1", "skill2"]
  },
  "experience": [
    {
      "title": "job title (unchanged)",
      "company": "company name (unchanged)",
      "location": "location (unchanged)",
      "startDate": "date (unchanged)",
      "endDate": "date (unchanged)",
      "highlights": [
        "Modified bullet point with **bolded** JD keywords and metrics",
        "Only include relevant points that match JD requirements"
      ]
    }
  ],
  "projects": [
    {
      "title": "project name (unchanged)",
      "startDate": "date (unchanged)",
      "endDate": "date (unchanged)",
      "technologies": "technologies (may be updated to include JD terms)",
      "highlights": [
        "Modified bullet point with **bolded** JD keywords and metrics",
        "Only include relevant points that match JD requirements"
      ]
    }
  ],
  "education": [
    // Keep education entries as-is from current resume
  ],
  "changes": ["Change 1", "Change 2"],
  "explanation": "Brief explanation of optimizations made for ATS matching"
}

REMEMBER:
- DO NOT add new experience or project entries
- DO NOT fabricate skills or experiences
- Only modify existing entries
- Remove irrelevant bullet points
- Keep it concise and authentic
- Target ATS score: 90+`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL_CONFIG.jdOptimization,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Optimize this resume for the job description above. Ensure ATS score of 90+ while maintaining authenticity and keeping it concise.`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid response format from API');
  }

  const result = JSON.parse(data.choices[0].message.content);

  return NextResponse.json({
    type: 'generate_new_resume',
    todoList: intent.todoList,
    result: result,
    updatedResume: {
      ...currentResume,
      summary: result.summary,
      skills: result.skills,
      experience: result.experience,
      projects: result.projects,
      education: result.education || currentResume.education
    },
    message: `✅ Resume optimized for ATS (Target: 90+ score)!\n\n${result.explanation || ''}\n\nChanges made:\n${(result.changes || []).map((c: string) => `• ${c}`).join('\n')}\n\nYour resume has been tailored to match the job description while staying authentic and concise.`,
    requiresAction: true
  });
}

async function handleGeneralResponse(
  message: string,
  profile: any,
  currentResume: any,
  conversationHistory: Array<{ role: string; content: string }>
) {
  return handleGeneralQuestion(message, profile, currentResume, conversationHistory);
}

