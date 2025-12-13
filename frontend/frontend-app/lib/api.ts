/**
 * Get the API base URL dynamically
 * Works in both local development and GitHub Codespaces
 */
export function getApiBaseUrl(): string {
  // Client-side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('.app.github.dev')) {
      // Codespaces: replace frontend port (3000 or 3001) with backend port
      const apiHostname = hostname.replace('-3000.', '-5007.').replace('-3001.', '-5007.');
      return `https://${apiHostname}`;
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5007';
    }
  }
  
  // Server-side or production - use Azure
  return process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
}

/**
 * Safe fetch wrapper that handles JSON parsing errors and authentication
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; status?: number }> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`API Error (${response.status}):`, text.substring(0, 200));
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        const errorMsg = '🔒 Authentication required. Your session may have expired. Please log in again.';
        
        // Show user-friendly error
        if (typeof window !== 'undefined') {
          alert(errorMsg);
          
          // Optionally redirect to login
          const shouldRedirect = confirm('Would you like to go to the login page now?');
          if (shouldRedirect) {
            window.location.href = '/auth/login';
          }
        }
        
        return {
          data: null,
          error: errorMsg,
          status: 401
        };
      }
      
      // Handle other HTTP errors
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(text);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Use default error message
      }
      
      return {
        data: null,
        error: errorMessage,
        status: response.status
      };
    }
    
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      return { data, error: null };
    } catch (parseError) {
      console.error('JSON Parse Error:', text.substring(0, 200));
      return {
        data: null,
        error: 'Invalid JSON response from server'
      };
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    
    // Provide more helpful network error messages
    let errorMessage = 'Network error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '🌐 Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      data: null,
      error: errorMessage
    };
  }
}
