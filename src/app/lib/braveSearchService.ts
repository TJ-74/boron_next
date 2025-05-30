interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  extra_snippets?: string[];
  meta_url?: {
    scheme: string;
    netloc: string;
    hostname: string;
    favicon: string;
  };
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
  infobox?: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
  };
  news?: {
    results: BraveSearchResult[];
  };
}

interface CompanyResearch {
  companyName: string;
  description: string;
  recentNews: string[];
  keyInfo: string[];
  website?: string;
  industry?: string;
}

interface PersonResearch {
  name: string;
  title?: string;
  company: string;
  background: string[];
  recentActivities: string[];
  linkedIn?: string;
}

class BraveSearchService {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Brave Search API key not configured. Research features will be disabled.');
    } else {
      console.log('✅ Brave Search API key is configured');
    }
  }

  // Add method to check API status
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getStatus(): string {
    if (!this.apiKey) {
      return 'API key not configured - add BRAVE_SEARCH_API_KEY to your .env.local file';
    }
    return 'API key configured and ready';
  }

  private async makeSearchRequest(query: string, options: {
    count?: number;
    safesearch?: 'strict' | 'moderate' | 'off';
    freshness?: 'pd' | 'pw' | 'pm' | 'py'; // past day, week, month, year
    text_decorations?: boolean;
    extra_snippets?: boolean;
  } = {}): Promise<BraveSearchResponse | null> {
    if (!this.apiKey) {
      console.warn('Brave Search API key not available');
      return null;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        count: (options.count || 10).toString(),
        safesearch: options.safesearch || 'moderate',
        text_decorations: (options.text_decorations || false).toString(),
        extra_snippets: (options.extra_snippets || true).toString(),
      });

      if (options.freshness) {
        params.append('freshness', options.freshness);
      }

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Brave Search API request failed:', error);
      return null;
    }
  }

  async researchCompany(companyName: string): Promise<CompanyResearch> {
    const research: CompanyResearch = {
      companyName,
      description: '',
      recentNews: [],
      keyInfo: [],
      website: '',
      industry: '',
    };

    if (!this.apiKey) {
      return research;
    }

    try {
      // Search for general company information
      const generalQuery = `"${companyName}" company about mission values`;
      const generalResults = await this.makeSearchRequest(generalQuery, {
        count: 5,
        extra_snippets: true,
      });

      // Search for recent news about the company
      const newsQuery = `"${companyName}" news 2024 2025`;
      const newsResults = await this.makeSearchRequest(newsQuery, {
        count: 5,
        freshness: 'pm', // past month
        extra_snippets: true,
      });

      // Search for company culture and technology
      const cultureQuery = `"${companyName}" careers culture technology stack hiring`;
      const cultureResults = await this.makeSearchRequest(cultureQuery, {
        count: 3,
        extra_snippets: true,
      });

      // Process general information
      if (generalResults?.web?.results) {
        const companyWebsite = generalResults.web.results.find(result => 
          result.url.toLowerCase().includes(companyName.toLowerCase().replace(/\s+/g, '')) ||
          result.title.toLowerCase().includes(companyName.toLowerCase())
        );
        
        if (companyWebsite) {
          research.website = companyWebsite.url;
          research.description = companyWebsite.description || '';
        }

        // Extract key information from search results
        generalResults.web.results.forEach(result => {
          if (result.description) {
            research.keyInfo.push(result.description);
          }
          if (result.extra_snippets) {
            research.keyInfo.push(...result.extra_snippets);
          }
        });
      }

      // Process news results
      if (newsResults?.web?.results) {
        newsResults.web.results.forEach(result => {
          if (result.title && result.description) {
            research.recentNews.push(`${result.title}: ${result.description}`);
          }
        });
      }

      // Process culture/hiring information
      if (cultureResults?.web?.results) {
        cultureResults.web.results.forEach(result => {
          if (result.description && result.description.toLowerCase().includes('culture') || 
              result.description.toLowerCase().includes('hiring') ||
              result.description.toLowerCase().includes('career')) {
            research.keyInfo.push(result.description);
          }
        });
      }

      // Use infobox if available
      if (generalResults?.infobox) {
        if (generalResults.infobox.description) {
          research.description = generalResults.infobox.description;
        }
        if (generalResults.infobox.url) {
          research.website = generalResults.infobox.url;
        }
      }

      // Limit arrays to prevent overwhelming the LLM
      research.keyInfo = research.keyInfo.slice(0, 8);
      research.recentNews = research.recentNews.slice(0, 5);

    } catch (error) {
      console.error('Error researching company:', error);
    }

    return research;
  }

  async researchPerson(personName: string, companyName: string): Promise<PersonResearch> {
    const research: PersonResearch = {
      name: personName,
      company: companyName,
      background: [],
      recentActivities: [],
    };

    if (!this.apiKey) {
      return research;
    }

    try {
      // Search for person at company
      const personQuery = `"${personName}" "${companyName}" recruiter LinkedIn profile`;
      const personResults = await this.makeSearchRequest(personQuery, {
        count: 5,
        extra_snippets: true,
      });

      // Search for person's professional background
      const backgroundQuery = `"${personName}" experience background career ${companyName}`;
      const backgroundResults = await this.makeSearchRequest(backgroundQuery, {
        count: 3,
        extra_snippets: true,
      });

      // Process person search results
      if (personResults?.web?.results) {
        personResults.web.results.forEach(result => {
          // Look for LinkedIn profile
          if (result.url.includes('linkedin.com')) {
            research.linkedIn = result.url;
            if (result.description) {
              research.background.push(result.description);
            }
          }
          
          // Extract title/role information
          if (result.title.toLowerCase().includes(personName.toLowerCase()) &&
              result.title.toLowerCase().includes(companyName.toLowerCase())) {
            const titleMatch = result.title.match(/(?:at|@)\s*([^|•\-]+)/i);
            if (titleMatch) {
              research.title = titleMatch[1].trim();
            }
          }

          if (result.description) {
            research.background.push(result.description);
          }
        });
      }

      // Process background search results
      if (backgroundResults?.web?.results) {
        backgroundResults.web.results.forEach(result => {
          if (result.description && 
              (result.description.toLowerCase().includes(personName.toLowerCase()) ||
               result.description.toLowerCase().includes('experience') ||
               result.description.toLowerCase().includes('background'))) {
            research.background.push(result.description);
          }
        });
      }

      // Limit arrays to prevent overwhelming the LLM
      research.background = research.background.slice(0, 5);
      research.recentActivities = research.recentActivities.slice(0, 3);

    } catch (error) {
      console.error('Error researching person:', error);
    }

    return research;
  }

  async researchBoth(companyName: string, recruiterName: string): Promise<{
    company: CompanyResearch;
    recruiter: PersonResearch;
  }> {
    try {
      console.log(`🔍 BraveSearchService: Starting research for company="${companyName}" recruiter="${recruiterName}"`);
      console.log(`🔑 API Key available: ${!!this.apiKey}`);
      
      // If no API key, return mock data for testing
      if (!this.apiKey) {
        console.log('🔧 No API key found, returning mock research data for testing');
        return {
          company: {
            companyName,
            description: `${companyName} is a technology company focused on innovation and growth.`,
            recentNews: [
              `${companyName} announces new product launch and expansion plans`,
              `${companyName} receives industry recognition for workplace culture`
            ],
            keyInfo: [
              `${companyName} values innovation, collaboration, and professional development`,
              `Growing team with focus on cutting-edge technology solutions`,
              `Strong emphasis on work-life balance and employee satisfaction`
            ],
            website: `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: 'Technology'
          },
          recruiter: {
            name: recruiterName,
            company: companyName,
            title: 'Senior Talent Acquisition Specialist',
            background: [
              `${recruiterName} has 5+ years of experience in talent acquisition at ${companyName}`,
              `Specializes in technical hiring and building diverse, high-performing teams`
            ],
            recentActivities: [],
            linkedIn: `https://linkedin.com/in/${recruiterName.toLowerCase().replace(/\s+/g, '-')}`
          }
        };
      }
      
      // Run both searches in parallel for efficiency
      const [companyResearch, recruiterResearch] = await Promise.all([
        this.researchCompany(companyName),
        this.researchPerson(recruiterName, companyName),
      ]);

      console.log(`✅ Company research completed:`, {
        hasDescription: !!companyResearch.description,
        newsCount: companyResearch.recentNews.length,
        keyInfoCount: companyResearch.keyInfo.length
      });
      
      console.log(`✅ Recruiter research completed:`, {
        hasTitle: !!recruiterResearch.title,
        hasLinkedIn: !!recruiterResearch.linkedIn,
        backgroundCount: recruiterResearch.background.length
      });

      return {
        company: companyResearch,
        recruiter: recruiterResearch,
      };
    } catch (error) {
      console.error('Error researching company and recruiter:', error);
      
      // Return empty research if search fails
      return {
        company: {
          companyName,
          description: '',
          recentNews: [],
          keyInfo: [],
        },
        recruiter: {
          name: recruiterName,
          company: companyName,
          background: [],
          recentActivities: [],
        },
      };
    }
  }
}

export default BraveSearchService;
export type { CompanyResearch, PersonResearch }; 