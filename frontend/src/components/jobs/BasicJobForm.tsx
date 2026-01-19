'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LocationDropdownsString from '@/components/LocationDropdownsString'

interface BusinessProfile {
  id: string
  name: string | null
}

interface BasicJobFormProps {
  businessProfile: BusinessProfile | null
}

export default function BasicJobForm({ businessProfile }: BasicJobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    title: '',
    city: '',
    state: '',
    country: '',
    work_type: 'full-time',
    hours: '',
    pay: '',
    start_date: 'ASAP',
    start_date_custom: '',
    description: '',
    must_have_1: '',
    must_have_2: '',
    must_have_3: '',
    must_have_4: '',
    must_have_5: '',
    must_have_6: '',
    licences: [] as string[],
    status: 'draft',
  })

  const licenceOptions = [
    'Driver\'s License',
    'Police Check',
    'Working with Children Check',
    'First Aid Certificate',
    'Food Handling Certificate',
    'Security License',
    'Other'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleLicenceChange = (licence: string) => {
    setFormData(prev => ({
      ...prev,
      licences: prev.licences.includes(licence)
        ? prev.licences.filter(l => l !== licence)
        : [...prev.licences, licence]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validation
    if (!formData.title.trim()) {
      setErrors({ title: 'Job title is required' })
      setIsSubmitting(false)
      return
    }

    if (!formData.city.trim() || !formData.state.trim()) {
      setErrors({ location: 'Location (city and state) is required' })
      setIsSubmitting(false)
      return
    }

    if (!businessProfile || !businessProfile.id) {
      setErrors({ submit: 'Business profile not found. Please complete your business profile setup first.' })
      setIsSubmitting(false)
      return
    }

    try {
      // Get the current user's session (required for RLS)
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData?.session?.user?.id
      if (!uid) {
        setErrors({ submit: 'Not authenticated' })
        setIsSubmitting(false)
        return
      }

      // Use the business profile ID from the prop (already validated by parent component)
      // ID is a UUID string in Supabase
      const businessProfileId = businessProfile.id
      if (!businessProfileId || typeof businessProfileId !== 'string') {
        setErrors({ submit: 'Invalid business profile ID' })
        setIsSubmitting(false)
        return
      }

      // Build must-have requirements array
      const mustHavePoints = [
        formData.must_have_1,
        formData.must_have_2,
        formData.must_have_3,
        formData.must_have_4,
        formData.must_have_5,
        formData.must_have_6,
      ].filter(point => point.trim().length > 0)

      // Build location string
      const locationParts = [formData.city, formData.state, formData.country].filter(Boolean)
      const location = locationParts.join(', ')

      // Parse pay (handle ranges and "negotiable")
      let salary_min: number | null = null
      let salary_max: number | null = null
      if (formData.pay && formData.pay.toLowerCase() !== 'negotiable') {
        const payMatch = formData.pay.match(/(\d+)\s*-\s*(\d+)/)
        if (payMatch) {
          salary_min = parseFloat(payMatch[1])
          salary_max = parseFloat(payMatch[2])
        } else {
          const singlePay = parseFloat(formData.pay.replace(/[^0-9.]/g, ''))
          if (!isNaN(singlePay)) {
            salary_min = singlePay
          }
        }
      }

      // Build requirements text from must-haves and licences
      const requirementsParts = []
      if (mustHavePoints.length > 0) {
        requirementsParts.push('Must have:')
        mustHavePoints.forEach(point => requirementsParts.push(`• ${point}`))
      }
      if (formData.licences.length > 0) {
        requirementsParts.push('\nLicences/Checks required:')
        formData.licences.forEach(licence => requirementsParts.push(`• ${licence}`))
      }
      const requirements = requirementsParts.join('\n')

      // Determine start date
      const startDateText = formData.start_date === 'ASAP' ? 'ASAP' : formData.start_date_custom

      // Build description with start date
      const fullDescription = formData.description
        ? `${formData.description}\n\nStart date: ${startDateText}`
        : `Start date: ${startDateText}`

      // Build base payload without extra_metadata (schema-tolerant)
      const basePayload: any = {
        title: formData.title,
        description: fullDescription,
        requirements: requirements || null,
        employment_type: formData.work_type,
        salary_min,
        salary_max,
        salary_currency: 'USD',
        remote_allowed: false,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        location: location || null,
        required_skills: [],
        preferred_skills: [],
        status: formData.status,
        business_profile_id: businessProfileId, // Use ID from users table for RLS
      }

      // Try to add job_post_type if column exists, otherwise store in tags
      const metadataPayload: any = {
        job_post_type: 'basic',
        hours: formData.hours || null,
        start_date: startDateText,
        licences: formData.licences,
      }

      // Try different payload structures (schema-tolerant)
      const candidates = [
        // Try with job_post_type and tags
        { 
          ...basePayload, 
          job_post_type: 'basic',
          tags: [metadataPayload]
        },
        // Try with just job_post_type
        { 
          ...basePayload, 
          job_post_type: 'basic'
        },
        // Try with tags only
        { 
          ...basePayload, 
          tags: [{ type: 'basic', ...metadataPayload }]
        },
        // Try without job_post_type (base payload already has business_profile_id)
        basePayload,
      ]

      let lastErr: any = null
      for (const payload of candidates) {
        const ins: any = await supabase.from('jobs').insert(payload as any).select('id').maybeSingle()
        if (!ins.error) {
          router.push('/dashboard/business?tab=vacancies')
          return
        }
        lastErr = ins.error
        const msg = String(ins.error?.message ?? '')
        const code = String(ins.error?.code ?? '')
        const isMissingCol = code === 'PGRST204' || /Could not find the .* column/i.test(msg)
        if (isMissingCol) continue
        break
      }

      setErrors({
        submit: lastErr?.message || 'Failed to create job. Please ensure your Supabase schema has a jobs table.',
      })
    } catch (error: any) {
      console.error('Error creating job:', error)
      setErrors({
        submit: error?.message || 'Failed to create job. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Basic Job Post</h1>
      <p className="text-gray-600 mb-8">Quick and simple job posting for small businesses</p>

      <form onSubmit={handleSubmit} className="dashboard-card rounded-xl p-8 space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none transition-colors ${
              errors.title ? 'border-red-500' : 'border-gray-300 focus:border-[#20C997]'
            }`}
            placeholder="e.g., Store Manager"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <LocationDropdownsString
            country={formData.country}
            state={formData.state}
            city={formData.city}
            onCountryChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
            onStateChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
            onCityChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
          />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>

        {/* Work Type & Hours */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
            <select
              name="work_type"
              value={formData.work_type}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
            >
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="casual">Casual</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
            <input
              type="text"
              name="hours"
              value={formData.hours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="e.g., 38 hours/week or 9am-5pm"
            />
          </div>
        </div>

        {/* Pay & Start Date */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pay (Optional)</label>
            <input
              type="text"
              name="pay"
              value={formData.pay}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="e.g., $50,000 - $60,000 or negotiable"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <select
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997] mb-2"
            >
              <option value="ASAP">ASAP</option>
              <option value="custom">Specific Date</option>
            </select>
            {formData.start_date === 'custom' && (
              <input
                type="date"
                name="start_date_custom"
                value={formData.start_date_custom}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
              />
            )}
          </div>
        </div>

        {/* Short Role Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Role Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
            placeholder="Brief description of the role..."
          />
        </div>

        {/* Must Have Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Must Have (3-6 points)</label>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <input
                key={num}
                type="text"
                name={`must_have_${num}`}
                value={formData[`must_have_${num}` as keyof typeof formData] as string}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder={`Must have ${num}...`}
              />
            ))}
          </div>
        </div>

        {/* Licences / Checks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Licences / Checks (Optional)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {licenceOptions.map((licence) => (
              <label key={licence} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.licences.includes(licence)}
                  onChange={() => handleLicenceChange(licence)}
                  className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
                />
                <span className="text-sm text-gray-700">{licence}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-[#20C997] text-white rounded-lg font-semibold hover:bg-[#1DB886] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Job Post'}
          </button>
          <Link
            href="/dashboard/business"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
