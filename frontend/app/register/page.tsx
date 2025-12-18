'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    user_type: 'talent'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.username) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    // BYPASS MODE: Password validation is optional
    // Only validate if password is provided (allow empty passwords)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters (if provided)'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // #region agent log
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:71',message:'API URL resolved',data:{apiUrl,envVar:process.env.NEXT_PUBLIC_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // Test backend connectivity before registration
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:76',message:'Testing backend health check',data:{apiUrl:`${apiUrl}/health`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        await axios.get(`${apiUrl}/health`, { timeout: 3000 })
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:79',message:'Backend health check succeeded',data:{apiUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
      } catch (healthError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:82',message:'Backend health check failed',data:{apiUrl,error:healthError.message,code:healthError.code,isNetworkError:!healthError.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        throw new Error('Backend is not running. Please start the backend server.')
      }
      
      // Prepare request body with explicit password field
      // BYPASS MODE: Password is optional - allow empty passwords
      const requestBody = {
        email: formData.email,
        username: formData.username,
        password: formData.password || "", // Include password (empty string if not provided - bypass mode)
        full_name: formData.full_name?.trim() || undefined,
        user_type: formData.user_type
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:93',message:'Attempting registration request',data:{url:`${apiUrl}/api/auth/register`,requestBody:{...requestBody,password:'[REDACTED]'},hasPassword:'password' in requestBody,passwordLength:requestBody.password?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const response = await axios.post(`${apiUrl}/api/auth/register`, requestBody)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:88',message:'Registration request succeeded',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (response.data) {
        setSuccess(true)
        // Auto-login after registration to get access token
        try {
          const loginResponse = await axios.post(`${apiUrl}/api/auth/login`, {
            email: formData.email,
            password: formData.password
          })
          
          if (loginResponse.data.access_token) {
            localStorage.setItem('access_token', loginResponse.data.access_token)
            localStorage.setItem('user_email', formData.email)
            
            // Get user_type from login response, registration response, or formData
            const userType = loginResponse.data.user?.user_type || 
                            response.data.user_type || 
                            formData.user_type
            
            // Redirect based on user type
            if (userType === 'business') {
              setTimeout(() => {
                router.push('/dashboard/business')
              }, 1500)
            } else {
              // Default to talent dashboard
              setTimeout(() => {
                router.push('/dashboard/talent')
              }, 1500)
            }
          } else {
            // Fallback to login page
            setTimeout(() => {
              router.push('/login')
            }, 2000)
          }
        } catch (loginError) {
          // If auto-login fails, redirect to login page
          console.error('Auto-login failed:', loginError)
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:140',message:'Registration request failed',data:{hasResponse:!!error.response,status:error.response?.status,error_detail:error.response?.data?.detail,error_data:error.response?.data,code:error.code,message:error.message,isNetworkError:!error.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (error.response) {
        // Handle different error response formats
        let errorMessage = 'Registration failed'
        const errorData = error.response.data
        
        if (errorData?.detail) {
          // FastAPI returns detail as string or array
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => 
              `${err.loc?.join('.')}: ${err.msg}`
            ).join(', ')
          } else {
            errorMessage = errorData.detail
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
        
        console.error('Registration error:', errorMessage, error.response.data)
        setErrors({ submit: errorMessage })
      } else {
        setErrors({ submit: 'Network error. Please check if backend is running.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-white text-2xl font-bold">Creerlio</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-gray-400">Join the AI-powered talent and business platform</p>
        </div>

        {/* Registration Form */}
        <div className="dashboard-card rounded-xl p-8 border border-blue-500/20">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
              <p className="text-gray-400 mb-4">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  I am a...
                </label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="talent">Talent / Job Seeker</option>
                  <option value="business">Business / Employer</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.email ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.username ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="johndoe"
                />
                {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.password ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

