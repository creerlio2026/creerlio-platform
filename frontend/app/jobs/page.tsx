'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Job {
  id: string
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
  business_profile_id: string | number | null
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    keyword: '',
    location: ''
  })

  useEffect(() => {
    let cancelled = false
    supabase.auth
      .getSession()
      .then((res: any) => {
        const data = res?.data
        const uid = data?.session?.user?.id ?? null
        if (cancelled) return
        setUserId(uid)
        setIsAuthenticated(!!uid)
      })
      .catch(() => {
        if (cancelled) return
        setUserId(null)
        setIsAuthenticated(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    if (!userId) {
      setAppliedJobs(new Set())
      return
    }
    fetchMyApplications(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchJobs = async () => {
    setIsLoading(true)
    setJobsError(null)
    try {
      const keyword = (filters.keyword || '').trim()
      const loc = (filters.location || '').trim()

      let qb: any = supabase
        .from('jobs')
        .select(
          'id,title,description,location,city,country,employment_type,remote_allowed,salary_min,salary_max,salary_currency,required_skills,created_at,business_profile_id,status'
        )
        .limit(200)

      // Prefer published jobs if this column exists; if it doesn't, Supabase will return an error and we'll fall back.
      qb = qb.eq('status', 'published')
      if (keyword) qb = qb.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
      if (loc) qb = qb.or(`location.ilike.%${loc}%,city.ilike.%${loc}%,country.ilike.%${loc}%`)

      let res: any = await qb
      if (res.error) {
        // Try again without status filter (schema may not have it)
        qb = supabase
          .from('jobs')
          .select(
            'id,title,description,location,city,country,employment_type,remote_allowed,salary_min,salary_max,salary_currency,required_skills,created_at,business_profile_id'
          )
          .limit(200)
        if (keyword) qb = qb.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        if (loc) qb = qb.or(`location.ilike.%${loc}%,city.ilike.%${loc}%,country.ilike.%${loc}%`)
        res = await qb
      }

      if (res.error) {
        setJobs([])
        setJobsError('Jobs are not configured yet (missing jobs table or permissions).')
        return
      }

      const mapped: Job[] = (res.data || []).map((j: any) => ({
        id: String(j?.id),
        title: typeof j?.title === 'string' ? j.title : 'Job',
        description: typeof j?.description === 'string' ? j.description : null,
        location: typeof j?.location === 'string' ? j.location : null,
        city: typeof j?.city === 'string' ? j.city : null,
        country: typeof j?.country === 'string' ? j.country : null,
        employment_type: typeof j?.employment_type === 'string' ? j.employment_type : null,
        remote_allowed: !!j?.remote_allowed,
        salary_min: typeof j?.salary_min === 'number' ? j.salary_min : null,
        salary_max: typeof j?.salary_max === 'number' ? j.salary_max : null,
        salary_currency: typeof j?.salary_currency === 'string' ? j.salary_currency : null,
        required_skills: Array.isArray(j?.required_skills) ? j.required_skills : null,
        created_at: typeof j?.created_at === 'string' ? j.created_at : new Date().toISOString(),
        business_profile_id: (j?.business_profile_id as any) ?? null,
      }))

      setJobs(mapped)
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      setJobs([])
      setJobsError('Jobs could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyApplications = async (uid: string) => {
    try {
      // Try common table names
      const tables = ['job_applications', 'applications']
      for (const table of tables) {
        const res: any = await supabase.from(table).select('job_id').eq('user_id', uid).limit(500)
        if (!res.error) {
          const ids = new Set<string>((res.data || []).map((r: any) => String(r?.job_id)).filter(Boolean))
          setAppliedJobs(ids)
          return
        }
      }
      setAppliedJobs(new Set())
    } catch {
      setAppliedJobs(new Set())
    }
  }

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated || !userId) {
      router.push('/login?redirect=/jobs')
      return
    }

    setApplyingJobId(jobId)
    try {
      const payload = { user_id: userId, job_id: jobId }
      const tables = ['job_applications', 'applications']
      for (const table of tables) {
        const res: any = await supabase.from(table).insert(payload as any)
        if (!res.error) {
          setAppliedJobs((prev) => new Set([...Array.from(prev), jobId]))
          return
        }
      }
      alert('Job applications are not available yet (missing applications table or permissions).')
    } catch (error: any) {
      console.error('Error applying to job:', error)
      alert('Failed to apply. Please try again.')
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

        {jobsError && (
          <div className="mb-6 border border-amber-500/30 bg-amber-500/10 text-amber-200 rounded-lg p-4">
            {jobsError}
          </div>
        )}

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
