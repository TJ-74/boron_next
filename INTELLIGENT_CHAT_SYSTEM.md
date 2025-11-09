# Intelligent Resume Chat System

## Overview

The resume chat now has **intelligent intent detection** that:
- ✅ Answers general questions without regenerating the resume
- ✅ Makes targeted edits to specific sections only
- ✅ Creates a todo list before making changes
- ✅ Only runs the full 7-agent pipeline when generating a new resume

## How It Works

### 1. Intent Analysis
Every user message is analyzed by an AI agent that determines:
- **What type of action** the user wants
- **Which section** needs to be modified (if any)
- **What specific changes** are requested
- **A todo list** of actions needed

### 2. Intent Types

#### `general_question`
User is asking about resume tips, ATS, formatting, etc.

**Examples:**
- "How do I write a good summary?"
- "What is ATS optimization?"
- "Should I include my GPA?"

**Action:** Answer directly without modifying the resume

---

#### `edit_summary`
User wants to change the professional summary.

**Examples:**
- "Change the summary to focus on leadership"
- "Rewrite my summary to emphasize data science"
- "Make the summary more concise"

**Action:** Only rewrite the summary section

---

#### `edit_experience`
User wants to modify a specific experience entry.

**Examples:**
- "Change the description for my Google internship"
- "Add more metrics to my Software Engineer role"
- "Rewrite the highlights for my current job"

**Action:** Only modify the specified experience entry

---

#### `edit_project`
User wants to modify a specific project.

**Examples:**
- "Update the E-commerce Platform project description"
- "Add React to my portfolio project"
- "Make the AI Chatbot project sound more impressive"

**Action:** Only modify the specified project

---

#### `edit_skills`
User wants to add/remove/reorganize skills.

**Examples:**
- "Add Python and TensorFlow to my skills"
- "Remove outdated technologies"
- "Reorganize my skills by importance"

**Action:** Only modify the skills section

---

#### `generate_new_resume`
User provides a new job description or wants a complete new resume.

**Examples:**
- "Here's a job description for a Senior Developer role..."
- "I'm applying for a Data Scientist position at Amazon"
- "Generate a new resume for this job posting"

**Action:** Run the full 7-agent coordinator pipeline

---

## Chat Flow

### Example 1: General Question

```
User: "How do I make my resume ATS-friendly?"

System:
1. Analyzes intent → general_question
2. Generates answer directly
3. No resume modifications

Bot: "To make your resume ATS-friendly:
• Use standard section headings
• Include relevant keywords from the job description
• Avoid complex formatting and tables
• Use a clean, simple layout
• Save as PDF or .docx"
```

### Example 2: Targeted Edit

```
User: "Change my summary to emphasize machine learning experience"

System:
1. Analyzes intent → edit_summary
2. Creates todo list:
   - Identify ML experience from profile
   - Rewrite summary with ML focus
   - Keep it 3-4 sentences
3. Only rewrites summary section

Bot: "✅ Summary updated!

I've rewritten your summary to emphasize your machine learning expertise.

Changes made:
• Added ML frameworks (TensorFlow, PyTorch)
• Highlighted 3 years of ML experience
• Mentioned specific ML projects
• Kept professional tone and length"
```

### Example 3: New Resume Generation

```
User: "Here's a job description for a Senior Software Engineer at Google..."

System:
1. Analyzes intent → generate_new_resume
2. Creates todo list:
   - Analyze job requirements
   - Match profile to requirements
   - Select best projects
   - Optimize experience descriptions
   - Enhance skills
   - Generate summary
   - Assemble resume
3. Triggers full 7-agent pipeline

Bot: "📋 I'll generate a new tailored resume for you!

Todo List:
1. Analyze Google's job requirements
2. Match your profile to the role
3. Select most relevant projects
4. Optimize experience descriptions
5. Add missing critical skills
6. Generate perfect summary
7. Assemble final resume

Starting the 7-agent optimization process...

🚀 Starting AI-powered resume generation...
📊 Step 1: Analyzing job description...
✅ Job analysis complete
🎯 Step 2: Matching profile to requirements...
..."
```

## API Endpoints

### `/api/resume-chat-handler` (NEW)
Intelligent chat handler that routes to appropriate action.

**Request:**
```json
{
  "message": "User's message",
  "profile": { /* UserProfile */ },
  "currentResume": { /* Current resume data */ },
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response Types:**

#### General Answer
```json
{
  "type": "general_answer",
  "message": "Answer to user's question",
  "requiresAction": false
}
```

#### Section Edit
```json
{
  "type": "edit_summary" | "edit_experience" | "edit_project" | "edit_skills",
  "todoList": ["Action 1", "Action 2"],
  "result": {
    "newSummary": "...",
    "changes": ["Change 1", "Change 2"],
    "explanation": "..."
  },
  "updatedResume": { /* Updated resume data */ },
  "message": "Success message with changes",
  "requiresAction": true
}
```

#### New Resume Request
```json
{
  "type": "generate_new_resume",
  "todoList": ["Action 1", "Action 2", ...],
  "message": "Todo list and confirmation message",
  "requiresAction": true,
  "action": "trigger_coordinator"
}
```

### `/api/resume-agents/coordinator`
Full 7-agent pipeline for complete resume generation.

**Only called when:**
- User provides a new job description
- User explicitly requests a new resume
- Intent analysis determines `generate_new_resume`

## Benefits

### 1. **Efficiency**
- No unnecessary API calls
- Faster responses for simple questions
- Only processes what's needed

### 2. **Cost Savings**
- General questions: ~500 tokens
- Targeted edits: ~1,000-2,000 tokens
- Full generation: ~9,000-13,000 tokens

### 3. **Better UX**
- Instant answers to questions
- Quick edits without waiting
- Clear todo lists before actions
- Transparent about what's happening

### 4. **Precision**
- Only modifies requested sections
- Preserves other resume parts
- Maintains consistency

## Examples

### ✅ DO: Targeted Edits

```
"Add Python to my skills" → Only modifies skills section
"Make my summary shorter" → Only rewrites summary
"Change my Google experience description" → Only modifies that experience
```

### ✅ DO: General Questions

```
"What's a good resume length?" → Answers directly
"Should I include hobbies?" → Provides advice
"How do I format dates?" → Explains best practices
```

### ✅ DO: Full Generation

```
"Here's a job posting..." → Runs full pipeline
"Generate resume for Data Scientist role" → Runs full pipeline
"I'm applying to Amazon" + job description → Runs full pipeline
```

### ❌ DON'T: Unnecessary Full Generation

```
"Fix a typo" → Should be targeted edit, not full generation
"Add one skill" → Should be skills edit, not full generation
"Make summary longer" → Should be summary edit, not full generation
```

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Intent Detection Confidence
The system uses a confidence score (0-1) to determine intent:
- **High confidence (>0.8)**: Proceeds with detected intent
- **Medium confidence (0.5-0.8)**: Proceeds but logs for review
- **Low confidence (<0.5)**: Defaults to general question

## Monitoring

### Logs
Each request logs:
- User message
- Detected intent type
- Confidence score
- Todo list
- Action taken

### Example Log
```
📋 User Intent: edit_summary
📝 Todo List: [
  "Identify ML experience from profile",
  "Rewrite summary with ML focus",
  "Keep it 3-4 sentences"
]
✅ Summary updated successfully
```

## Future Enhancements

- [ ] Multi-section edits (e.g., "update summary and skills")
- [ ] Batch operations (e.g., "improve all project descriptions")
- [ ] Undo/redo functionality
- [ ] Version history
- [ ] A/B testing different edits
- [ ] User feedback on intent detection accuracy

---

**Built with ❤️ using Next.js, TypeScript, and OpenAI GPT-4o**

