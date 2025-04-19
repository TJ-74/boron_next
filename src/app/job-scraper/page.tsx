'use client'

import React, { useState } from 'react';
import { Navbar } from '@/app/components/ui/navbar';
import { Footer } from '@/app/components/ui/footer';

export default function JobScraper() {
  const [url, setUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setJobDescription('');

    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to scrape job description');
      }

      const data = await response.json();
      setJobDescription(data.jobDescription);
    } catch (err) {
      setError('Failed to scrape job description. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Job Description Scraper</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                Job Posting URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter job posting URL"
                required
                className="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading
                  ? 'bg-blue-600 opacity-50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Scraping...' : 'Scrape Job Description'}
            </button>
          </form>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {jobDescription && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Scraped Job Description</h2>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300">{jobDescription}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 