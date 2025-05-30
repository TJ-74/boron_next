# 🔍 Brave Search Integration Setup Guide

This feature adds automatic company and recruiter research to the AI email generation using Brave Search API.

## ✨ What This Feature Does

- **Automatically researches companies** before generating emails
- **Looks up recruiter information** including LinkedIn profiles and background
- **Finds recent company news** and updates to reference in emails
- **Discovers company culture, values, and hiring information**
- **Creates highly personalized emails** with real company insights
- **No manual research needed** - everything is automatic

## 🚀 Setup Instructions

### 1. Get Brave Search API Key

1. Go to [Brave Search API](https://api.search.brave.com/register)
2. Sign up for a free account (2,000 queries/month)
3. Choose the **"Data for AI"** plan (required for LLM integration)
4. Get your API key from the dashboard

### 2. Add Environment Variable

Add your Brave Search API key to your `.env.local` file:

```bash
# AI Email Generation
GROQ_API_KEY=your_groq_api_key_here

# Brave Search API for Company Research
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here
```

### 3. Restart Your Application

```bash
npm run dev
```

## 🎯 How It Works

1. **User clicks "Research & Generate Email"**
2. **AI researches the company:**
   - Company overview and mission
   - Recent news and updates
   - Culture and hiring information
   - Company website and industry

3. **AI researches the recruiter:**
   - Professional background
   - LinkedIn profile (if found)
   - Role and title information
   - Recent activities

4. **AI generates personalized email:**
   - References specific company information
   - Shows knowledge of recent company news
   - Connects candidate background to company needs
   - Mentions recruiter's role or background when relevant

## 📋 API Plans

**Free Tier**: 2,000 searches/month (perfect for getting started)
**Base Plan**: $5 CPM for up to 20M queries/month
**Pro Plan**: $9 CPM for unlimited queries

## 🔧 Features Added

- Live company research using Brave Search
- Recruiter background lookup
- Real-time status updates during research
- Enhanced email personalization with research insights
- Automatic fallback if research fails

## 🎨 UI Updates

- New "Research & Generate Email" button with search icon
- Research status indicator during generation
- Updated description highlighting research capabilities
- Progress feedback for better user experience

## 🚨 Important Notes

- Research adds ~3-5 seconds to email generation time
- Feature gracefully degrades if API key is missing
- All research is performed in real-time for maximum accuracy
- Research data is used only for email generation (not stored)

## 🐛 Troubleshooting

**"Research features disabled"**: Add `BRAVE_SEARCH_API_KEY` to your environment variables

**"Failed to generate email"**: Check if your Brave Search API key is valid and you have remaining quota

**"No research data found"**: This is normal for less-known companies - the AI will still generate good emails

## 💡 Pro Tips

1. **Company names**: Use exact company names for best research results
2. **Recruiter names**: Full names work better than first names only
3. **Additional context**: Still useful for providing specific details not found in research
4. **Review emails**: Always review generated emails before sending

---

**Powered by Brave Search API** - Independent, privacy-focused search with comprehensive coverage 