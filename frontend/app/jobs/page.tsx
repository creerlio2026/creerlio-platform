'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface Job {
  id: number
  title: string
  description: string | null
  location: string | null
  city: string | null
  country: string | null
  employment_type: string | null
  remote_allowed: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  required_skills: string[] | null
  created_at: string
  business_profile_id: number
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set())
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    keyword: '',
    location: ''
  })

  useEffect(() => {
    // Check auth status
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    setIsAuthenticated(!!token && !!email)
    setUserEmail(email)
    
    fetchJobs()
    if (token && email) {
      fetchMyApplications(email)
    }
  }, [filters])

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const params: any = {}
      
      if (filters.keyword) {
        params.keyword = filters.keyword
      }
      if (filters.location) {
        params.location = filters.location
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'jobs/page.tsx:55',message:'Fetching jobs - before request',data:{url:`${apiUrl}/api/jobs/public`,params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      const response = await axios.get(`${apiUrl}/api/jobs/public`, { params })
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'jobs/page.tsx:68',message:'Fetching jobs - response received',data:{status:response.status,hasJobs:!!response.data?.jobs,jobCount:response.data?.jobs?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (response.data && Array.isArray(response.data.jobs)) {
        setJobs(response.data.jobs)
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/6182f207-3db2-4ea3-b5df-968f1e2a56cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'jobs/page.tsx:72',message:'Fetching jobs - error',data:{errorMessage:error.message,status:error.response?.status,statusText:error.response?.statusText,url:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyApplications = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/applications/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.data && Array.isArray(response.data.applications)) {
        const appliedIds = new Set(response.data.applications.map((app: any) => app.job_id))
        setAppliedJobs(appliedIds)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const handleApply = async (jobId: number) => {
    if (!isAuthenticated || !userEmail) {
      router.push('/login?redirect=/jobs')
      return
    }

    setApplyingJobId(jobId)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.post(
        `${apiUrl}/api/applications`,
        { job_id: jobId },
        {
          params: { email: userEmail },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      )

      if (response.data.success) {
        setAppliedJobs(prev => new Set([...prev, jobId]))
        // Refresh applications list
        fetchMyApplications(userEmail)
      }
    } catch (error: any) {
      console.error('Error applying to job:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to apply. Please try again.'
      alert(errorMessage)
      
      // If error is about profile, redirect to edit
      if (errorMessage.includes('profile')) {
        router.push('/dashboard/talent/edit')
      }
    } finally {
      setApplyingJobId(null)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || 'USD'
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `${currency} ${job.salary_min.toLocaleString()}+`
    }
    return `Up to ${currency} ${job.salary_max?.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Creerlio
            </Link>
            <nav className="hidden lg:flex items-center gap-x-8 text-sm text-slate-300">
              <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
              <Link href="/jobs" className="hover:text-blue-400 transition-colors text-blue-400">Jobs</Link>
            </nav>
            <Link
              href="/dashboard/business"
              className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-sm text-white transition-colors"
            >
              Business Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Job Listings</h1>

        {/* Filters */}
        <div className="dashboard-card rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Keywords</label>
              <input
                type="text"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Job title, skills, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="City, State, or Country"
              />
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="dashboard-card rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          📍 {job.location}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="capitalize">{job.employment_type}</span>
                      )}
                      {job.remote_allowed && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Remote</span>
                      )}
                      {formatSalary(job) && (
                        <span>{formatSalary(job)}</span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                    )}
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.required_skills.slice(0, 5).map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                        {job.required_skills.length > 5 && (
                          <span className="px-3 py-1 text-gray-400 text-sm">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    {appliedJobs.has(job.id) ? (
                      <div className="text-center">
                        <button
                          disabled
                          className="px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold border border-green-500/50 cursor-not-allowed"
                        >
                          Applied
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Application submitted</p>
                      </div>
                    ) : isAuthenticated ? (
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={applyingJobId === job.id}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {applyingJobId === job.id ? 'Applying...' : 'Apply'}
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/talent"
                        className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-center"
                      >
                        Apply Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-card rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No jobs found</p>
            <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
