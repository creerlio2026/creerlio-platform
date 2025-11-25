'use client';

import { useEffect, useState } from 'react';

export default function ApiTestPage() {
  const [status, setStatus] = useState<string>('Testing...');
  const [details, setDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    testApi();
  }, []);

  const testApi = async () => {
    try {
      const hostname = window.location.hostname;
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      
      if (hostname.includes('.app.github.dev')) {
        const apiHostname = hostname.replace('-3000.', '-5007.');
        baseUrl = `https://${apiHostname}`;
      }

      setDetails({
        hostname,
        baseUrl,
        timestamp: new Date().toISOString(),
      });

      // Test 1: Health check
      const healthUrl = `${baseUrl}/health`;
      console.log('Testing:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('✅ API is accessible');
        setDetails(prev => ({ ...prev, health: data, status: response.status }));
      } else {
        setStatus(`❌ API returned ${response.status}`);
        setDetails(prev => ({ ...prev, status: response.status, statusText: response.statusText }));
      }
    } catch (error) {
      setStatus('❌ Failed to connect to API');
      setDetails(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      }));
      console.error('API Test Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
        
        <div className="mb-6">
          <div className="text-lg font-semibold mb-2">Status:</div>
          <div className="text-xl">{status}</div>
        </div>

        <div>
          <div className="text-lg font-semibold mb-2">Details:</div>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>

        <button
          onClick={testApi}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Test
        </button>

        <div className="mt-6 text-sm text-gray-600">
          <p className="mb-2">If you see "Failed to connect to API", possible causes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Backend API is not running (should be on port 5007)</li>
            <li>CORS configuration issue</li>
            <li>Network/firewall blocking the request</li>
            <li>GitHub Codespaces port forwarding issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
