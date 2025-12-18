'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface User {
  id: number
  email: string
  user_type: string
}

interface BusinessProfile {
  id: number
  name: string
}

export default function CreateJobPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    employment_type: 'full-time',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    remote_allowed: false,
    city: '',
    state: '',
    country: '',
    location: '',
    required_skills: '',
    preferred_skills: '',
    experience_level: '',
    education_level: '',
    status: 'draft',
    application_url: '',
    application_email: ''
  })

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
      const userResponse = await axios.get(`${apiUrl}/api/auth/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      setUser(userResponse.data)

      if (userResponse.data.user_type !== 'business') {
        router.push('/dashboard/talent')
        return
      }

      // Fetch business profile
      const businessResponse = await axios.get(`${apiUrl}/api/business/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (businessResponse.data) {
        setBusinessProfile(businessResponse.data)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' })
      setIsSubmitting(false)
      return
    }

    if (!businessProfile) {
      setErrors({ submit: 'Business profile not found' })
      setIsSubmitting(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      // Parse skills from comma-separated strings
      const required_skills = formData.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      const preferred_skills = formData.preferred_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const response = await axios.post(
        `${apiUrl}/api/jobs`,
        {
          business_profile_id: businessProfile.id,
          title: formData.title,
          description: formData.description || null,
          requirements: formData.requirements || null,
          responsibilities: formData.responsibilities || null,
          employment_type: formData.employment_type,
          salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
          salary_currency: formData.salary_currency,
          remote_allowed: formData.remote_allowed,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          location: formData.location || null,
          required_skills: required_skills,
          preferred_skills: preferred_skills,
          experience_level: formData.experience_level || null,
          education_level: formData.education_level || null,
          status: formData.status,
          application_url: formData.application_url || null,
          application_email: formData.application_email || null
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      )

      if (response.data.success) {
        router.push('/dashboard/business')
      }
    } catch (error: any) {
      console.error('Error creating job:', error)
      setErrors({
        submit: error.response?.data?.detail || 'Failed to create job. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/dashboard/business" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <Link
          href="/dashboard/business"
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
        >
          Back to Dashboard
        </Link>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Create Job Posting</h1>

        <form onSubmit={handleSubmit} className="dashboard-card rounded-xl p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                errors.title ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="e.g., Senior Software Engineer"
            />
            {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Job description..."
            />
          </div>

          {/* Location */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Country"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Required Skills (comma-separated)</label>
              <input
                type="text"
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="JavaScript, React, Node.js"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Skills (comma-separated)</label>
              <input
                type="text"
                name="preferred_skills"
                value={formData.preferred_skills}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="TypeScript, AWS, Docker"
              />
            </div>
          </div>

          {/* Employment Type & Status */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Employment Type</label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black focus:outline-none focus:border-blue-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Remote Allowed */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="remote_allowed"
              checked={formData.remote_allowed}
              onChange={handleChange}
              className="w-4 h-4 text-blue-500 bg-white border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-300">Remote work allowed</label>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
            <Link
              href="/dashboard/business"
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
