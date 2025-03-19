// Helper function to convert text to LaTeX-safe format
export const convertToLatex = (text: string): string => {
  return text
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
};

// Helper function to format dates for LaTeX
export const formatDateForLatex = (dateString?: string, isPresent?: boolean): string => {
  if (isPresent) return 'Present';
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
}; 