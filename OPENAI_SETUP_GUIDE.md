# OpenAI Chat Integration Setup Guide

## Overview
The Boron chat feature has been updated to use OpenAI instead of Groq for better AI responses.

## Setup Instructions

### Step 1: Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the generated API key

### Step 2: Environment Configuration
Add the following environment variable to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Step 3: Restart Development Server
Restart your Next.js development server to load the new environment variable:

```bash
pnpm dev
```

## How It Works

### Model Used
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.7 (balanced creativity and accuracy)
- **Max Tokens**: 1000 (concise responses)

### Features
- ✅ **Profile-Aware Responses**: AI has access to user's profile data
- ✅ **Context-Aware**: Maintains conversation history
- ✅ **Fallback Support**: Uses local responses if API fails
- ✅ **Error Handling**: Graceful degradation

### API Endpoint
- **Route**: `/api/chat`
- **Method**: POST
- **Payload**:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Tell me about my experience"}
    ],
    "profile": {
      "name": "John Doe",
      "experiences": [...],
      "education": [...],
      "skills": [...],
      "projects": [...]
    }
  }
  ```

## Testing

### Test the Chat
1. Navigate to any profile page
2. Click the chatbot button (bottom-right)
3. Ask questions like:
   - "Tell me about my experience"
   - "What skills do I have?"
   - "Show me my education"

### Without API Key
If no API key is set, the chat falls back to local keyword-based responses.

## Troubleshooting

### Common Issues

1. **"API key not found" error**
   - Ensure `OPENAI_API_KEY` is in `.env.local`
   - Restart the development server

2. **Rate limit exceeded**
   - OpenAI has usage limits based on your plan
   - Consider upgrading your OpenAI plan for higher limits

3. **Network errors**
   - Check your internet connection
   - Ensure OpenAI services are not blocked by firewall

### Switching Models
To use a different model, modify `/api/chat/route.ts`:

```typescript
// Change from:
model: 'gpt-3.5-turbo'
// To:
model: 'gpt-4' // or 'gpt-4-turbo-preview'
```

## Cost Considerations

- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- **GPT-4**: ~$0.03 per 1K tokens (10x more expensive)
- Monitor usage at [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## Security Notes

- ✅ API key is server-side only (never exposed to client)
- ✅ Profile data is sent securely via HTTPS
- ✅ No sensitive information stored in conversation history
- ✅ Fallback responses protect against API failures

---

For questions or issues, check the OpenAI documentation or create an issue in the project repository.
