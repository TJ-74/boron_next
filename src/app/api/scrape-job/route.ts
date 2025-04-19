import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();

    // Load the HTML content into cheerio
    const $ = cheerio.load(html);

    // Common selectors for job descriptions across different job sites
    const selectors = [
      '.job-description',
      '#job-description',
      '[data-test="job-description"]',
      '.description',
      '.jobDescriptionText',
      '[class*="description"]',
      '[class*="jobDescription"]',
      '.details',
      '.job-details',
      'article',
      '.posting-requirements',
    ];

    let jobDescription = '';

    // Try each selector until we find content
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        jobDescription = element.text().trim();
        break;
      }
    }

    // If no content found with specific selectors, try getting the main content
    if (!jobDescription) {
      jobDescription = $('main').text().trim() ||
                      $('.main').text().trim() ||
                      $('body').text().trim();
    }

    // Clean up the text
    jobDescription = jobDescription
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    return NextResponse.json({ jobDescription });
  } catch (error) {
    console.error('Error scraping job description:', error);
    return NextResponse.json(
      { error: 'Failed to scrape job description' },
      { status: 500 }
    );
  }
} 