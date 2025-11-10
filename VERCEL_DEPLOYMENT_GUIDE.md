# Vercel Deployment Guide for Boron Resume Generator

## Overview
This guide explains the optimizations made to handle Vercel's serverless function timeout limits and ensure smooth production deployment.

## Problem
Vercel serverless functions have execution time limits:
- **Hobby Plan**: 10 seconds
- **Pro Plan**: 60 seconds
- **Enterprise Plan**: 900 seconds (15 minutes)

The multi-agent resume generation system makes multiple sequential OpenAI API calls, which can exceed these limits.

## Solution

### 1. Parallel Processing Optimization
We optimized the agent pipeline to run independent operations in parallel:

**Before (Sequential - ~15-20 seconds):**
```
Step 1: Job Analysis (2-3s)
Step 2: Profile Matching (2-3s)
Step 3: Project Optimization (3-4s)
Step 4: Experience Optimization (3-4s)
Step 5: Skills Enhancement (2-3s)
Step 6: Summary Generation (2-3s)
Step 7: Assembly (instant)
Total: ~15-20 seconds
```

**After (Parallel - ~8-10 seconds):**
```
Step 1: Job Analysis (2-3s)
Step 2: Profile Matching (2-3s)
Step 3: PARALLEL Optimization (3-4s)
  ├─ Project Optimization
  ├─ Experience Optimization
  └─ Skills Enhancement
Step 4: Summary Generation (2-3s)
Step 5: Assembly (instant)
Total: ~8-10 seconds
```

### 2. Vercel Configuration
Created `vercel.json` to extend timeout for the coordinator endpoint:

```json
{
  "functions": {
    "src/app/api/resume-agents/coordinator/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**Note:** `maxDuration: 60` requires a **Vercel Pro plan** ($20/month). On the Hobby plan, the maximum is 10 seconds.

### 3. Code Changes

#### File: `src/app/api/resume-agents/coordinator/route.ts`

**Parallel Execution:**
```typescript
// Run three independent agents in parallel
const [projectOptimization, experienceOptimization, skillsEnhancement] = await Promise.all([
  callProjectOptimizer(profile, jobAnalysis, matchAnalysis),
  callExperienceOptimizer(profile, jobAnalysis, matchAnalysis),
  enhanceSkills(profile, jobAnalysis, matchAnalysis)
]);
```

This reduces execution time by ~40-50% since these three agents don't depend on each other's output.

## Deployment Steps

### For Hobby Plan Users (10s timeout)
If you're on the Hobby plan, the parallel optimization should be sufficient to stay under 10 seconds in most cases. However, for complex profiles or long job descriptions, you may still hit the limit.

**Workaround:**
1. Keep profiles concise (3-4 experiences, 3-4 projects)
2. Ensure job descriptions are focused (not entire job postings)
3. Consider upgrading to Pro plan for production use

### For Pro Plan Users (60s timeout)
1. Ensure `vercel.json` is in your project root
2. Deploy normally: `vercel --prod`
3. The 60-second timeout will be automatically applied

### Environment Variables
Ensure these are set in Vercel:
```bash
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Monitoring & Debugging

### Check Function Execution Time
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the coordinator function
3. View execution time in the logs

### If Still Timing Out

**Option 1: Further Optimize (Advanced)**
- Reduce OpenAI `max_tokens` in each agent
- Use `gpt-3.5-turbo` instead of `gpt-4o` (faster but lower quality)
- Implement caching for job analysis results

**Option 2: Move to Background Processing**
- Use a queue system (e.g., Vercel KV + background jobs)
- Return immediately and notify user when complete
- Requires more complex architecture

**Option 3: Self-Host**
- Deploy to a platform without timeout limits (Railway, Render, AWS Lambda with extended timeout)
- Use a VPS or dedicated server

## Performance Metrics

### Expected Execution Times (with parallel optimization)

| Profile Complexity | Job Description Length | Estimated Time |
|-------------------|------------------------|----------------|
| Simple (2-3 items) | Short (< 500 words) | 6-8 seconds |
| Medium (4-5 items) | Medium (500-1000 words) | 8-10 seconds |
| Complex (6+ items) | Long (> 1000 words) | 10-15 seconds |

### OpenAI API Costs (per resume generation)

| Model | Tokens Used | Cost per Resume |
|-------|-------------|-----------------|
| gpt-4o | ~15,000-20,000 | $0.30-$0.40 |
| gpt-3.5-turbo | ~15,000-20,000 | $0.03-$0.04 |

## Troubleshooting

### Error: "Task timed out after 10 seconds"
- **Cause**: On Hobby plan or function taking too long
- **Solution**: Upgrade to Pro plan or simplify profile/job description

### Error: "OpenAI API rate limit"
- **Cause**: Too many requests in short time
- **Solution**: Implement rate limiting on frontend or upgrade OpenAI tier

### Error: "Invalid response from agent"
- **Cause**: OpenAI returned unexpected format
- **Solution**: Check OpenAI API status, verify API key, check logs

## Best Practices

1. **Profile Optimization**: Encourage users to keep profiles focused
2. **Job Description**: Validate and truncate extremely long job descriptions
3. **Error Handling**: Always show user-friendly error messages
4. **Monitoring**: Set up Vercel Analytics to track function performance
5. **Caching**: Consider caching job analysis results for popular job descriptions

## Alternative Architectures

### Option A: Hybrid Approach
- Quick analysis on serverless (< 10s)
- Deep optimization in background job
- Notify user when complete

### Option B: Client-Side Streaming
- Stream each agent's result as it completes
- User sees progressive updates
- Better UX even with longer processing

### Option C: Edge Functions
- Use Vercel Edge Functions for faster cold starts
- Limited to lighter AI models
- Consider for pre-processing steps

## Support

For issues or questions:
1. Check Vercel logs: `vercel logs`
2. Check OpenAI status: https://status.openai.com
3. Review this guide and adjust configuration

## Updates

- **v1.0** (Current): Parallel optimization, 60s timeout support
- **Future**: Background job processing, caching layer, edge function support

