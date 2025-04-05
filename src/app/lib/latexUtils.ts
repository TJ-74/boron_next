// Helper function to detect and format dates in text
export const formatDatesInText = (text: string): string => {
  if (!text) return '';
  
  // Match common date formats:
  // YYYY-MM, MM/YYYY, MM-YYYY
  const datePatterns = [
    /\b(\d{4})-(\d{2})\b/g,  // YYYY-MM
    /\b(\d{2})\/(\d{4})\b/g, // MM/YYYY
    /\b(\d{2})-(\d{4})\b/g   // MM-YYYY
  ];
  
  let formattedText = text;
  
  datePatterns.forEach(pattern => {
    formattedText = formattedText.replace(pattern, (match, p1, p2) => {
      try {
        // For YYYY-MM format
        if (pattern === datePatterns[0]) {
          const date = new Date(parseInt(p1), parseInt(p2) - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        // For MM/YYYY and MM-YYYY formats
        else {
          const date = new Date(parseInt(p2), parseInt(p1) - 1);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
      } catch (e) {
        return match; // Keep original if parsing fails
      }
    });
  });
  
  return formattedText;
};

// Helper function to convert text to LaTeX-safe format
export const convertToLatex = (text: string): string => {
  if (!text) return '';
  
  // First format any dates in the text
  const textWithFormattedDates = formatDatesInText(text);
  
  return textWithFormattedDates
    .replace(/\\/g, '\\textbackslash{}') // Must be first to not interfere with other replacements
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
};

// Helper function to format dates for LaTeX
export const formatDateForLatex = (dateString?: string, isPresent?: boolean): string => {
  if (isPresent) return 'Present';
  if (!dateString || dateString.trim() === '') return 'Present';
  
  try {
    // Handle YYYY-MM format from month input type
    if (dateString.includes('-')) {
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      if (isNaN(date.getTime())) return 'Present'; // Invalid date
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } 
    // Handle MM/YYYY format
    else if (dateString.includes('/')) {
      const [month, year] = dateString.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      if (isNaN(date.getTime())) return 'Present'; // Invalid date
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    // Handle existing date strings
    else {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Present'; // Invalid date
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  } catch (e) {
    return 'Present'; // Return Present for any parsing errors
  }
};

// Helper function to format a date range for LaTeX
export const formatDateRangeForLatex = (startDate?: string, endDate?: string): string => {
  const start = formatDateForLatex(startDate);
  const end = formatDateForLatex(endDate, !endDate);
  return `${start} -- ${end}`;
};

// Helper function to safely format URLs for LaTeX
export const formatUrlForLatex = (url?: string): string => {
  if (!url) return '';
  
  // Ensure URL is properly escaped for LaTeX
  const escapedUrl = url
    .replace(/%/g, '\\%') // Escape % first
    .replace(/#/g, '\\#')
    .replace(/&/g, '\\&')
    .replace(/_/g, '\\_');
  
  return escapedUrl;
}; 