'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { API_URL } from '@/lib/config';

type UserType = 'Talent' | 'Business' | null;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        userType: userType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        ...(userType === 'Business' && { companyName: formData.companyName }),
      };

      // Get API URL dynamically in browser
      const hostname = window.location.hostname;
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://creerlio-api.azurewebsites.net';
      
      // GitHub Codespaces URL pattern: <workspace>-<port>.app.github.dev
      if (hostname.includes('.app.github.dev')) {
        const apiHostname = hostname.replace('-3000.', '-5007.');
        baseUrl = `https://${apiHostname}`;
      }
      
      const apiUrl = `${baseUrl}/api/auth/register`;
      console.log('🌐 Current hostname:', hostname);
      console.log('🔗 API Base URL:', baseUrl);
      console.log('🔍 Full API URL:', apiUrl);
      console.log('📦 Registration data:', registrationData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      console.log('✅ Response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Registration failed' };
        }
        console.error('❌ Error response:', errorData);
        
        // Handle password validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(errorData.errors.join(' '));
        }
        
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', userType!);
      
      // Redirect based on user type
      if (userType === 'Talent') {
        router.push('/talent/dashboard');
      } else {
        router.push('/business/dashboard');
      }
    } catch (err: any) {
      console.error('💥 Registration error:', err);
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
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

      {/* Register Card */}
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {step === 1 ? (
            // Step 1: User Type Selection
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-gray-900 mb-2">Join Creerlio</h2>
                <p className="text-gray-600">Choose how you'd like to get started</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Talent Card */}
                <button
                  onClick={() => handleUserTypeSelect('Talent')}
                  className="group p-8 border-2 border-gray-200 rounded-xl hover:border-amber-600 hover:shadow-lg transition-all text-left"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mb-4 group-hover:from-amber-600 group-hover:to-amber-700 transition-all">
                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2">I'm looking for work</h3>
                  <p className="text-gray-600 text-sm">Join as a talent professional to find exciting opportunities and showcase your skills</p>
                  <div className="mt-4 text-amber-700 font-medium text-sm group-hover:underline">
                    Continue as Talent →
                  </div>
                </button>

                {/* Business Card */}
                <button
                  onClick={() => handleUserTypeSelect('Business')}
                  className="group p-8 border-2 border-gray-200 rounded-xl hover:border-amber-600 hover:shadow-lg transition-all text-left"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mb-4 group-hover:from-amber-600 group-hover:to-amber-700 transition-all">
                    <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-serif text-gray-900 mb-2">I'm hiring talent</h3>
                  <p className="text-gray-600 text-sm">Join as a business to access top talent and streamline your recruitment process</p>
                  <div className="mt-4 text-amber-700 font-medium text-sm group-hover:underline">
                    Continue as Business →
                  </div>
                </button>
              </div>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          ) : (
            // Step 2: Registration Form
            <div>
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-900 mr-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-2xl font-serif text-gray-900">Create your account</h2>
                  <p className="text-gray-600 text-sm">
                    Registering as {userType === 'Talent' ? 'a Talent Professional' : 'a Business'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {userType === 'Business' && (
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Company name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>
                )}

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 mt-1"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-amber-700 hover:text-amber-800 font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-amber-700 hover:text-amber-800 font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Note */}
        {step === 2 && (
          <p className="text-center text-gray-500 text-xs mt-6">
            Your information is secure and will never be shared without your consent
          </p>
        )}
      </div>
    </div>
  );
}
