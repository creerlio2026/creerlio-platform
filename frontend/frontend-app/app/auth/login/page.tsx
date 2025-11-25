'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { API_URL } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get API URL dynamically in browser
      const hostname = window.location.hostname;
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      
      // GitHub Codespaces URL pattern: <workspace>-<port>.app.github.dev
      if (hostname.includes('.app.github.dev')) {
        const apiHostname = hostname.replace('-3000.', '-5007.');
        baseUrl = `https://${apiHostname}`;
      }
      
      const apiUrl = `${baseUrl}/api/auth/login`;
      console.log('🌐 Current hostname:', hostname);
      console.log('🔗 API Base URL:', baseUrl);
      console.log('🔍 Full API URL:', apiUrl);
      console.log('📦 Login data:', formData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('✅ Response status:', response.status);
      console.log('✅ Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ HTTP Error Status:', response.status, response.statusText);
        
        // Try to get response text first
        const responseText = await response.text();
        console.error('❌ Raw response:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: `Login failed: ${response.status} ${response.statusText}` };
        }
        
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Login response data:', data);
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', data.userType);
      
      // Store user data for AuthContext
      const userData = {
        id: data.userId || data.user?.id || 'temp-' + Date.now(),
        email: data.email || formData.email,
        firstName: data.firstName || data.user?.firstName || formData.email.split('@')[0],
        lastName: data.lastName || data.user?.lastName || '',
        fullName: data.fullName || data.user?.fullName || `${data.firstName || formData.email.split('@')[0]} ${data.lastName || ''}`.trim(),
        userType: data.userType
      };
      
      console.log('✅ Storing user data:', userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Redirect based on user type
      if (data.userType === 'Talent') {
        router.push('/talent/dashboard');
      } else {
        router.push('/business/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'talent' | 'business') => {
    const demoCredentials = {
      talent: { email: 'talent@demo.com', password: 'Password123!' },
      business: { email: 'business@demo.com', password: 'Password123!' },
    };

    setFormData(demoCredentials[type]);
    
    // Auto-submit after setting demo credentials
    setTimeout(() => {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      document.querySelector('form')?.dispatchEvent(submitEvent);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 flex items-center justify-center p-4">
      {/* Logo Header */}
      <div className="absolute top-8 left-8">
        <button onClick={() => router.push('/')} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-2xl font-serif text-gray-900 tracking-tight">Creerlio</h1>
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to your Creerlio account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-amber-700 hover:text-amber-800 font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo Account Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-3">Try a demo account</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('talent')}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-amber-600 hover:text-amber-700 transition-all"
              >
                Demo Talent
              </button>
              <button
                onClick={() => handleDemoLogin('business')}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-amber-600 hover:text-amber-700 transition-all"
              >
                Demo Business
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/auth/register')}
                className="text-amber-700 hover:text-amber-800 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
