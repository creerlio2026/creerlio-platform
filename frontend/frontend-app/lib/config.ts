// API Configuration
// In development with GitHub Codespaces, the API URL is dynamically determined
// In production, this should be set via environment variables

export const getApiUrl = () => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // If accessing via GitHub Codespaces forwarded port
    const hostname = window.location.hostname;
    
    // GitHub Codespaces pattern: <name>-<port>.app.github.dev
    if (hostname.includes('.app.github.dev')) {
      // Replace the frontend port (3001) with API port (5007)
      const apiHostname = hostname.replace('-3001.', '-5007.');
      return `https://${apiHostname}`;
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5007';
    }
  }
  
  // Server-side or fallback - use Azure production URL
  return process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
};

export const API_URL = getApiUrl();

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🌐 Hostname:', window.location.hostname);
  console.log('🔗 API_URL:', API_URL);
}
