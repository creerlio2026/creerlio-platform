'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  user_type: string
  is_active: boolean
}

type TabType = 'overview' | 'profile' | 'portfolio' | 'applications'

export default function TalentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [talentProfile, setTalentProfile] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')

    if (!token || !email) {
      router.push('/login')
      return
    }

    // Fetch user info
    fetchUserInfo(email)
  }, [router])

  const fetchUserInfo = async (email: string) => {
    try {
      // #region agent log
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:39',message:'API URL resolved for dashboard',data:{apiUrl,envVar:process.env.NEXT_PUBLIC_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:40',message:'Attempting fetch user info',data:{url:`${apiUrl}/api/auth/me`,hasToken:!!localStorage.getItem('access_token')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:46',message:'Fetch user info succeeded',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setUser(response.data)
      
      // Fetch talent profile (by user email)
      fetchTalentProfileByEmail(email)
      // Fetch applications
      fetchApplications(email)
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/talent/page.tsx:52',message:'Fetch user info failed',data:{hasResponse:!!error.response,status:error.response?.status,code:error.code,message:error.message,isNetworkError:!error.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching user:', error)
      // If auth fails, redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_email')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTalentProfileByEmail = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/talent/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.data) {
        setTalentProfile(response.data)
      }
    } catch (error) {
      console.error('Error fetching talent profile:', error)
    }
  }

  const fetchApplications = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/applications/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.data && Array.isArray(response.data.applications)) {
        setApplications(response.data.applications)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = (): number => {
    if (!talentProfile) return 0
    
    const fields = [
      talentProfile.name,
      talentProfile.email,
      talentProfile.title,
      talentProfile.bio,
      talentProfile.skills && Array.isArray(talentProfile.skills) && talentProfile.skills.length > 0,
      talentProfile.location || (talentProfile.city && talentProfile.country),
      talentProfile.portfolio_url || talentProfile.portfolio_data
    ]
    
    const completedFields = fields.filter(Boolean).length
    return Math.round((completedFields / fields.length) * 100)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_email')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {user?.full_name || user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Talent Dashboard</h1>
          <p className="text-gray-400">Manage your profile, portfolio, and job applications</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {(['overview', 'profile', 'portfolio', 'applications'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Stats Card */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm">Profile Views</p>
                    <p className="text-3xl font-bold text-blue-400">0</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Applications</p>
                    <p className="text-3xl font-bold text-green-400">0</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Matches</p>
                    <p className="text-3xl font-bold text-purple-400">0</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/resume/upload"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Upload Resume
                  </Link>
                  <Link
                    href="/portfolio"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Edit Portfolio
                  </Link>
                  <Link
                    href="/talent/search"
                    className="block px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    Search Jobs
                  </Link>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Profile Summary</h2>
                {user && (
                  <div className="space-y-2">
                    <p className="text-gray-300"><span className="text-gray-500">Name:</span> {talentProfile?.name || user.full_name || user.username}</p>
                    <p className="text-gray-300"><span className="text-gray-500">Email:</span> {user.email}</p>
                    {talentProfile?.title && (
                      <p className="text-gray-300"><span className="text-gray-500">Title:</span> {talentProfile.title}</p>
                    )}
                    <div className="pt-2 border-t border-gray-800">
                      <p className="text-gray-500 text-sm mb-1">Profile Completion</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${calculateProfileCompletion()}%` }}
                          ></div>
                        </div>
                        <span className="text-blue-400 font-semibold">{calculateProfileCompletion()}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Talent Profile Section */}
            {talentProfile ? (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Talent Profile</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {talentProfile.skills?.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                    <p className="text-gray-300">{talentProfile.location || 'Not set'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dashboard-card rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Create Your Talent Profile</h2>
                <p className="text-gray-400 mb-4">Complete your profile to start matching with opportunities</p>
                <Link
                  href="/portfolio"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Profile
                </Link>
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your Profile</h2>
            {user && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                    <p className="text-white">{user.username}</p>
                  </div>
                  {user.full_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                      <p className="text-white">{user.full_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">User Type</label>
                    <p className="text-white capitalize">{user.user_type}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <Link
                    href="/dashboard/talent/edit"
                    className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio</h2>
            {talentProfile ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {talentProfile.skills?.map((skill: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                  <p className="text-gray-300">{talentProfile.location || 'Not set'}</p>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <Link
                    href="/portfolio"
                    className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Edit Portfolio
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No portfolio created yet</p>
                <Link
                  href="/portfolio"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Portfolio
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Job Applications</h2>
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">{app.job_title || 'Job'}</h3>
                        {app.job_location && (
                          <p className="text-gray-400 text-sm mb-2">📍 {app.job_location}</p>
                        )}
                        <p className="text-gray-500 text-sm">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'applied' ? 'bg-blue-500/20 text-blue-400' :
                          app.status === 'shortlisted' ? 'bg-green-500/20 text-green-400' :
                          app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          app.status === 'hired' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No applications yet</p>
                <Link
                  href="/jobs"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


