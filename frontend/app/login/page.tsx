'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:31',message:'Preparing login request',data:{has_email:!!formData.email,has_password:!!formData.password,password_length:formData.password?.length || 0,email:formData.email},"timestamp":Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // BYPASS MODE: Always include password field (empty string if not provided)
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: formData.email,
        password: formData.password || ""  // Include password (empty string if not provided - bypass mode)
      })
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:36',message:'Login request succeeded',data:{status:response.status},"timestamp":Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (response.data.access_token) {
        // Store token in localStorage
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('user_email', formData.email)
        
        // Get user_type from response (if available) or fetch user info
        const userType = response.data.user?.user_type
        
        // Store user type in localStorage for quick access
        if (response.data.user?.user_type) {
          localStorage.setItem('user_type', response.data.user.user_type)
        }
        
        if (userType) {
          // Redirect to appropriate dashboard based on user type
          if (userType === 'business') {
            router.push('/dashboard/business')
          } else {
            router.push('/dashboard/talent')
          }
        } else {
          // Fallback: Fetch user info to get user_type for proper redirect
          try {
            const userResponse = await axios.get(`${apiUrl}/api/auth/me`, {
              params: { email: formData.email },
              headers: {
                Authorization: `Bearer ${response.data.access_token}`
              }
            })
            
            const fetchedUserType = userResponse.data.user_type || 'talent'
            
            // Redirect to appropriate dashboard based on user type
            if (fetchedUserType === 'business') {
              router.push('/dashboard/business')
            } else {
              router.push('/dashboard/talent')
            }
          } catch (userError) {
            // If fetching user info fails, default to talent dashboard
            console.error('Error fetching user info:', userError)
            router.push('/dashboard/talent')
          }
        }
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:40',message:'Login request failed',data:{has_response:!!error.response,status:error.response?.status,error_detail:error.response?.data?.detail,error_data:error.response?.data},"timestamp":Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (error.response) {
        // Handle FastAPI validation errors (can be array or string)
        let errorMessage = 'Login failed'
        const errorData = error.response.data
        
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            // FastAPI validation errors are arrays
            errorMessage = errorData.detail.map((err: any) => 
              `${err.loc?.join('.')}: ${err.msg}`
            ).join(', ')
          } else {
            errorMessage = String(errorData.detail)
          }
        } else if (errorData?.message) {
          errorMessage = String(errorData.message)
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
        
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
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in with your email and password</p>
        </div>

        {/* Login Form */}
        <div className="dashboard-card rounded-xl p-8 border border-blue-500/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </form>
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


