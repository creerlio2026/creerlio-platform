'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Job {
  id: string
  title: string
  description: string | null
  requirements: string | null
  responsibilities: string | null
  location: string | null
  city: string | null
  state: string | null
  country: string | null
  employment_type: string | null
  remote_allowed: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  required_skills: string[] | null
  preferred_skills: string[] | null
  experience_level: string | null
  education_level: string | null
  application_url: string | null
  application_email: string | null
  created_at: string
  business_profile_id: string | number | null
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = params?.id as string
  const fromBusiness = searchParams?.get('from_business') // Business profile ID if coming from business profile

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isJobOwner, setIsJobOwner] = useState(false)
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkAuth() {
      const { data: session } = await supabase.auth.getSession()
      if (cancelled) return
      const uid = session?.session?.user?.id ?? null
      setUserId(uid)
      setIsAuthenticated(!!uid)
      
      if (uid) {
        // Get user type from metadata or profile
        const userTypeFromMeta = session?.session?.user?.user_metadata?.user_type
        setUserType(userTypeFromMeta || null)
        
        // Check if user is a business and owns this job
        if (userTypeFromMeta === 'business') {
          try {
            const { data: bp } = await supabase
              .from('business_profiles')
              .select('id')
              .eq('user_id', uid)
              .maybeSingle()
            
            if (bp?.id) {
              setBusinessProfileId(String(bp.id))
            }
          } catch (err) {
            console.error('Error checking business profile:', err)
          }
        }
      }
    }
    checkAuth()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!jobId) return
    fetchJob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, businessProfileId])

  useEffect(() => {
    if (!userId || !jobId) {
      setHasApplied(false)
      return
    }
    checkApplicationStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, jobId])

  async function fetchJob() {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch job without status filter initially - we'll check ownership after
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
      
      const { data, error: fetchError } = await query.maybeSingle()

      if (fetchError) {
        throw fetchError
      }

      if (!data) {
        setError('Job not found or no longer available')
        return
      }

      const jobBusinessId = data.business_profile_id || data.business_id || data.company_id
      
      // Check if current user owns this job (fetch business profile if not already fetched)
      let isOwner = false
      let currentBpId = businessProfileId
      
      if (userId && !businessProfileId && userType === 'business') {
        try {
          const { data: bp } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()
          
          if (bp?.id) {
            currentBpId = String(bp.id)
            setBusinessProfileId(currentBpId)
          }
        } catch (err) {
          console.error('Error checking ownership:', err)
        }
      }
      
      if (currentBpId && jobBusinessId && String(jobBusinessId) === String(currentBpId)) {
        isOwner = true
      }
      
      // If not owner and job is not published/active, show error
      if (!isOwner && (data.status !== 'published' || !data.is_active)) {
        setError('Job not found or no longer available')
        return
      }
      
      setIsJobOwner(isOwner)

      setJob({
        id: String(data.id),
        title: data.title || 'Job',
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        location: data.location,
        city: data.city,
        state: data.state,
        country: data.country,
        employment_type: data.employment_type,
        remote_allowed: data.remote_allowed || false,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        salary_currency: data.salary_currency || 'USD',
        required_skills: Array.isArray(data.required_skills) ? data.required_skills : null,
        preferred_skills: Array.isArray(data.preferred_skills) ? data.preferred_skills : null,
        experience_level: data.experience_level,
        education_level: data.education_level,
        application_url: data.application_url,
        application_email: data.application_email,
        created_at: data.created_at,
        business_profile_id: jobBusinessId,
      })
    } catch (err: any) {
      console.error('Error fetching job:', err)
      setError(err.message || 'Failed to load job details')
    } finally {
      setIsLoading(false)
    }
  }

  async function checkApplicationStatus() {
    if (!userId || !jobId) return

    try {
      // Check if user has already applied
      const tables = ['job_applications', 'applications']
      for (const table of tables) {
        const { data, error: checkError } = await supabase
          .from(table)
          .select('id')
          .eq('job_id', jobId)
          .eq('user_id', userId)
          .maybeSingle()

        if (!checkError && data) {
          setHasApplied(true)
          return
        }
      }
      setHasApplied(false)
    } catch (err) {
      console.error('Error checking application status:', err)
    }
  }

  async function handleApply() {
    if (!isAuthenticated) {
      // Redirect to login/register with return URL
      const returnUrl = `/jobs/${jobId}`
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}&mode=signup&role=talent`)
      return
    }

    if (userType !== 'talent') {
      alert('Only talent users can apply to jobs. Please register as talent.')
      router.push(`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}&mode=signup&role=talent`)
      return
    }

    if (hasApplied) {
      alert('You have already applied to this job.')
      return
    }

    setIsApplying(true)
    try {
      // First, get the talent profile ID for this user
      const { data: talentProfile, error: profileError } = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError || !talentProfile) {
        alert('Please complete your talent profile before applying to jobs.')
        router.push('/dashboard/talent/edit')
        return
      }

      // Apply via Supabase
      const { error: applyError } = await supabase
        .from('applications')
        .insert({
          user_id: userId,
          job_id: Number(jobId),
          talent_profile_id: talentProfile.id,
          status: 'applied',
          cover_letter: '',
          notes: '',
        })

      if (applyError) {
        // Check if it's a duplicate application error
        if (applyError.code === '23505' || applyError.message?.includes('unique')) {
          alert('You have already applied to this job.')
          setHasApplied(true)
        } else {
          throw applyError
        }
      } else {
        setHasApplied(true)
        alert('Application submitted successfully!')
      }
    } catch (err: any) {
      console.error('Error applying to job:', err)
      alert(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }

  function formatSalary(job: Job): string | null {
    if (!job.salary_min && !job.salary_max) return null
    const currency = job.salary_currency || 'USD'
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency
    if (job.salary_min && job.salary_max) {
      return `${symbol}${job.salary_min.toLocaleString()} - ${symbol}${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `${symbol}${job.salary_min.toLocaleString()}+`
    }
    if (job.salary_max) {
      return `Up to ${symbol}${job.salary_max.toLocaleString()}`
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="dashboard-card rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Job Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This job is no longer available.'}</p>
            <Link
              href="/jobs"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </div>
    )
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
              <Link href="/jobs" className="hover:text-blue-400 transition-colors">Jobs</Link>
            </nav>
            {fromBusiness ? (
              <Link
                href={`/dashboard/business/view?id=${fromBusiness}`}
                className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm"
              >
                ← Back to Business Profile
              </Link>
            ) : (
              <Link
                href="/jobs"
                className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm"
              >
                ← Back to Jobs
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Job Header */}
        <div className="dashboard-card rounded-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-white mb-4">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
            {job.location && (
              <span className="flex items-center gap-1">
                📍 {job.location}
              </span>
            )}
            {!job.location && (job.city || job.state || job.country) && (
              <span className="flex items-center gap-1">
                📍 {[job.city, job.state, job.country].filter(Boolean).join(', ')}
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

          {/* Action Buttons - Show Edit/Cancel for business owners, Apply for others */}
          {isJobOwner ? (
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/business/jobs/edit/${job.id}`}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Edit Job
              </Link>
              {job.status === 'published' && (
                <button
                  onClick={async () => {
                    if (!confirm(`Are you sure you want to cancel "${job.title}"? This will make it no longer visible to talent.`)) return
                    setIsCancelling(true)
                    try {
                      const { error: cancelError } = await supabase
                        .from('jobs')
                        .update({ status: 'cancelled', is_active: false })
                        .eq('id', job.id)
                      
                      if (cancelError) throw cancelError
                      
                      alert('Job cancelled successfully.')
                      // Refresh job data
                      fetchJob()
                    } catch (err: any) {
                      console.error('Error cancelling job:', err)
                      alert(err.message || 'Failed to cancel job. Please try again.')
                    } finally {
                      setIsCancelling(false)
                    }
                  }}
                  disabled={isCancelling}
                  className="px-8 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Job'}
                </button>
              )}
              {job.status === 'cancelled' && (
                <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50 text-sm">
                  This job has been cancelled
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {hasApplied ? (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="px-8 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold border border-green-500/50 cursor-not-allowed"
                  >
                    ✓ Applied
                  </button>
                  <span className="text-sm text-gray-400">Application submitted</span>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplying ? 'Applying...' : isAuthenticated ? 'Apply Now' : 'Register & Apply'}
                </button>
              )}
              {job.application_url && (
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Apply via External Link
                </a>
              )}
              {job.application_email && (
                <a
                  href={`mailto:${job.application_email}?subject=Application for ${encodeURIComponent(job.title)}`}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  Apply via Email
                </a>
              )}
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-6">
          {/* Description */}
          {job.description && (
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Job Description</h2>
              <div className="text-gray-300 whitespace-pre-wrap">{job.description}</div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Requirements</h2>
              <div className="text-gray-300 whitespace-pre-wrap">{job.requirements}</div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Responsibilities</h2>
              <div className="text-gray-300 whitespace-pre-wrap">{job.responsibilities}</div>
            </div>
          )}

          {/* Skills */}
          {(job.required_skills?.length || job.preferred_skills?.length) && (
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Skills</h2>
              {job.required_skills && job.required_skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.preferred_skills && job.preferred_skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Preferred Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferred_skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Details */}
          {(job.experience_level || job.education_level) && (
            <div className="dashboard-card rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Additional Details</h2>
              <div className="space-y-2 text-gray-300">
                {job.experience_level && (
                  <div>
                    <span className="font-semibold">Experience Level: </span>
                    {job.experience_level}
                  </div>
                )}
                {job.education_level && (
                  <div>
                    <span className="font-semibold">Education Level: </span>
                    {job.education_level}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
