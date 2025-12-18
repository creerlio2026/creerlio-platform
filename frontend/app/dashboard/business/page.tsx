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
}

interface BusinessProfile {
  id: number
  name: string
  description: string | null
  industry: string | null
  location: string | null
  city: string | null
  country: string | null
}

interface Job {
  id: number
  title: string
  status: string
  location: string | null
  city: string | null
  created_at: string
}

interface Applicant {
  id: number
  talent_name: string | null
  talent_email: string | null
  talent_title: string | null
  status: string
  created_at: string
}

export default function BusinessDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')

    if (!token || !email) {
      router.push('/login')
      return
    }

    fetchUserInfo(email)
  }, [router])

  const fetchUserInfo = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      setUser(response.data)
      
      // Fetch business profile
      fetchBusinessProfile(email)
      // Fetch jobs
      fetchJobs(response.data.id)
      
      // If a job is selected, fetch applicants
      if (selectedJobId) {
        fetchJobApplicants(selectedJobId, email)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_email')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBusinessProfile = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/business/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.data) {
        setBusinessProfile(response.data)
      }
    } catch (error) {
      console.error('Error fetching business profile:', error)
    }
  }

  const fetchJobs = async (userId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/jobs`, {
        params: { business_user_id: userId },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.data && Array.isArray(response.data.jobs)) {
        setJobs(response.data.jobs)
      } else if (response.data && response.data.jobs) {
        setJobs(response.data.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      // Set empty array on error
      setJobs([])
    }
  }

  const fetchJobApplicants = async (jobId: number, email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/applications/job/${jobId}`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.data && Array.isArray(response.data.applications)) {
        setApplicants(response.data.applications)
      }
    } catch (error) {
      console.error('Error fetching applicants:', error)
      setApplicants([])
    }
  }

  const handleJobClick = (jobId: number) => {
    const email = localStorage.getItem('user_email')
    if (email) {
      setSelectedJobId(jobId)
      fetchJobApplicants(jobId, email)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_email')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const activeJobsCount = jobs.filter(j => j.status === 'published' && j.status !== 'archived').length
  const locationsCount = businessProfile?.location ? 1 : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-300">Welcome, {user?.full_name || user?.username}</span>
          <button onClick={handleLogout} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800">
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold text-white mb-8">Business Dashboard</h1>

        {/* Business Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="dashboard-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">Business Name</h2>
              <Link
                href="/dashboard/business/edit"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Edit
              </Link>
            </div>
            <p className="text-gray-300 text-lg">{businessProfile?.name || 'Not set'}</p>
          </div>
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Locations</h2>
            <p className="text-3xl font-bold text-blue-400">{locationsCount}</p>
          </div>
          <div className="dashboard-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Active Jobs</h2>
            <p className="text-3xl font-bold text-green-400">{activeJobsCount}</p>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="dashboard-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Jobs</h2>
            <Link
              href="/dashboard/business/jobs/create"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Job
            </Link>
          </div>

          {jobs.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Location</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr 
                        key={job.id} 
                        className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                          selectedJobId === job.id ? 'bg-blue-500/10' : ''
                        }`}
                        onClick={() => handleJobClick(job.id)}
                      >
                        <td className="py-3 px-4 text-white">{job.title}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            job.status === 'published' ? 'bg-green-500/20 text-green-400' :
                            job.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{job.location || job.city || 'Not set'}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Applicants Panel */}
              <div className="dashboard-card rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {selectedJobId ? 'Applicants' : 'Select a job to view applicants'}
                </h3>
                {selectedJobId && applicants.length > 0 ? (
                  <div className="space-y-3">
                    {applicants.map((applicant) => (
                      <div key={applicant.id} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-semibold">{applicant.talent_name || 'Unknown'}</p>
                            {applicant.talent_title && (
                              <p className="text-gray-400 text-sm">{applicant.talent_title}</p>
                            )}
                            {applicant.talent_email && (
                              <p className="text-gray-500 text-xs mt-1">{applicant.talent_email}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            applicant.status === 'applied' ? 'bg-blue-500/20 text-blue-400' :
                            applicant.status === 'shortlisted' ? 'bg-green-500/20 text-green-400' :
                            applicant.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            applicant.status === 'hired' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {applicant.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs">
                          Applied: {new Date(applicant.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : selectedJobId ? (
                  <p className="text-gray-400">No applicants yet</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No jobs created yet</p>
              <Link
                href="/dashboard/business/jobs/create"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Your First Job
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


