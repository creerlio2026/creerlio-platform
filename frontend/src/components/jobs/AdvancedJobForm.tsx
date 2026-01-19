'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LocationDropdownsString from '@/components/LocationDropdownsString'

interface BusinessProfile {
  id: string
  name: string | null
}

interface AdvancedJobFormProps {
  businessProfile: BusinessProfile | null
}

export default function AdvancedJobForm({ businessProfile }: AdvancedJobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [businessData, setBusinessData] = useState<any>(null)

  const [formData, setFormData] = useState({
    // A) Role Basics
    title: '',
    internal_reference: '',
    category: '',
    subcategory: '',
    city: '',
    state: '',
    country: '',
    remote_type: 'on-site', // on-site, remote, hybrid
    work_type: 'full-time',
    contract_length: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    has_bonus: false,
    has_commission: false,
    schedule_pattern: '',

    // C) Role Details
    role_summary: '',
    responsibilities: '',
    success_outcomes: '',
    tools_systems: '',
    growth_progression: '',

    // D) Requirements
    skills: [] as string[],
    skill_input: '',
    experience_level: '',
    education_level: '',
    licences: [] as string[],
    checks: [] as string[],

    // E) Application Settings
    apply_via_creerlio: true,
    external_link: '',
    screening_questions: '',
    portfolio_required: true,
    cover_note_optional: false,
    privacy_notice: '',

    status: 'draft',
  })

  const licenceOptions = [
    'Driver\'s License',
    'Police Check',
    'Working with Children Check',
    'First Aid Certificate',
    'Food Handling Certificate',
    'Security License',
    'Professional Registration',
    'Other'
  ]

  const checkOptions = [
    'Police Check',
    'Working with Children Check',
    'Background Check',
    'Credit Check',
    'Drug Test',
    'Medical Check',
    'Other'
  ]

  const categoryOptions = [
    'Technology',
    'Healthcare',
    'Education',
    'Retail',
    'Hospitality',
    'Finance',
    'Construction',
    'Manufacturing',
    'Transportation',
    'Other'
  ]

  useEffect(() => {
    if (!businessProfile) return
    
    // Load business profile data for context
    ;(async () => {
      try {
        const { data } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', businessProfile.id)
          .maybeSingle()
        
        if (data) {
          setBusinessData(data)
        }

        // Also try to load from business_bank_items for culture, benefits, media
        const { data: bankItems } = await supabase
          .from('business_bank_items')
          .select('*')
          .eq('user_id', (await supabase.auth.getSession()).data.session?.user?.id)
          .eq('is_active', true)
        
        if (bankItems) {
          // Extract culture tags, benefits, media from bank items
          const cultureItems = bankItems.filter(item => item.item_type === 'culture' || item.metadata?.type === 'culture')
          const benefitItems = bankItems.filter(item => item.item_type === 'benefit' || item.metadata?.type === 'benefit')
          const mediaItems = bankItems.filter(item => ['image', 'video'].includes(item.item_type))
          
          setBusinessData((prev: any) => ({
            ...prev,
            cultureTags: cultureItems.map(item => item.title || item.metadata?.tag),
            benefits: benefitItems.map(item => item.title || item.description),
            media: mediaItems,
          }))
        }
      } catch (err) {
        console.error('Error loading business data:', err)
      }
    })()
  }, [businessProfile])

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

  const handleSkillAdd = () => {
    if (formData.skill_input.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.skill_input.trim()],
        skill_input: ''
      }))
    }
  }

  const handleSkillRemove = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const handleLicenceChange = (licence: string) => {
    setFormData(prev => ({
      ...prev,
      licences: prev.licences.includes(licence)
        ? prev.licences.filter(l => l !== licence)
        : [...prev.licences, licence]
    }))
  }

  const handleCheckChange = (check: string) => {
    setFormData(prev => ({
      ...prev,
      checks: prev.checks.includes(check)
        ? prev.checks.filter(c => c !== check)
        : [...prev.checks, check]
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

      // Build location string
      const locationParts = [formData.city, formData.state, formData.country].filter(Boolean)
      const location = locationParts.join(', ')

      // Parse salary
      const salary_min = formData.salary_min ? parseFloat(formData.salary_min) : null
      const salary_max = formData.salary_max ? parseFloat(formData.salary_max) : null

      // Build responsibilities from text (split by newlines or bullets)
      const responsibilitiesList = formData.responsibilities
        .split(/\n|•/)
        .map(line => line.trim())
        .filter(line => line.length > 0)

      // Build requirements text
      const requirementsParts = []
      if (formData.skills.length > 0) {
        requirementsParts.push('Required Skills:')
        formData.skills.forEach(skill => requirementsParts.push(`• ${skill}`))
      }
      if (formData.experience_level) {
        requirementsParts.push(`\nExperience Level: ${formData.experience_level}`)
      }
      if (formData.education_level) {
        requirementsParts.push(`Education: ${formData.education_level}`)
      }
      if (formData.licences.length > 0) {
        requirementsParts.push('\nLicences/Accreditations:')
        formData.licences.forEach(licence => requirementsParts.push(`• ${licence}`))
      }
      if (formData.checks.length > 0) {
        requirementsParts.push('\nChecks Required:')
        formData.checks.forEach(check => requirementsParts.push(`• ${check}`))
      }
      const requirements = requirementsParts.join('\n')

      // Build full description
      const descriptionParts = []
      if (formData.role_summary) {
        descriptionParts.push(formData.role_summary)
      }
      if (responsibilitiesList.length > 0) {
        descriptionParts.push('\n\nResponsibilities:')
        responsibilitiesList.forEach(resp => descriptionParts.push(`• ${resp}`))
      }
      if (formData.success_outcomes) {
        descriptionParts.push('\n\nSuccess Outcomes:')
        descriptionParts.push(formData.success_outcomes)
      }
      if (formData.tools_systems) {
        descriptionParts.push('\n\nTools & Systems:')
        descriptionParts.push(formData.tools_systems)
      }
      if (formData.growth_progression) {
        descriptionParts.push('\n\nGrowth & Progression:')
        descriptionParts.push(formData.growth_progression)
      }
      const description = descriptionParts.join('\n')

      // Determine remote status
      const remote_allowed = formData.remote_type === 'remote' || formData.remote_type === 'hybrid'

      // Build base payload without extra_metadata (schema-tolerant)
      const basePayload: any = {
        title: formData.title,
        description: description || null,
        requirements: requirements || null,
        responsibilities: formData.responsibilities || null,
        employment_type: formData.work_type,
        salary_min,
        salary_max,
        salary_currency: formData.salary_currency,
        remote_allowed,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        location: location || null,
        required_skills: formData.skills,
        preferred_skills: [],
        experience_level: formData.experience_level || null,
        education_level: formData.education_level || null,
        status: formData.status,
        application_url: formData.external_link || null,
        application_email: null,
        business_profile_id: businessProfileId, // Use ID from users table for RLS
      }

      // Store metadata in tags array (schema-tolerant)
      const metadataTags = formData.category ? [formData.category] : []
      const metadataPayload = {
        type: 'advanced',
        internal_reference: formData.internal_reference || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        remote_type: formData.remote_type,
        contract_length: formData.contract_length || null,
        has_bonus: formData.has_bonus,
        has_commission: formData.has_commission,
        schedule_pattern: formData.schedule_pattern || null,
        success_outcomes: formData.success_outcomes || null,
        tools_systems: formData.tools_systems || null,
        growth_progression: formData.growth_progression || null,
        licences: formData.licences,
        checks: formData.checks,
        screening_questions: formData.screening_questions || null,
        portfolio_required: formData.portfolio_required,
        cover_note_optional: formData.cover_note_optional,
        privacy_notice: formData.privacy_notice || null,
      }

      // Try different payload structures (schema-tolerant)
      const candidates = [
        // Try with job_post_type and tags
        { 
          ...basePayload, 
          job_post_type: 'advanced',
          tags: [...metadataTags, metadataPayload]
        },
        // Try with just job_post_type
        { 
          ...basePayload, 
          job_post_type: 'advanced',
          tags: metadataTags.length > 0 ? metadataTags : null
        },
        // Try with tags only (store metadata in tags)
        { 
          ...basePayload, 
          tags: [...metadataTags, metadataPayload]
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
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced Job Post</h1>
      <p className="text-gray-600 mb-8">Comprehensive, detailed job posting with full requirements</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* A) Role Basics */}
        <section className="dashboard-card rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">A) Role Basics</h2>
          
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
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Internal Reference ID</label>
              <input
                type="text"
                name="internal_reference"
                value={formData.internal_reference}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder="e.g., JOB-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
              >
                <option value="">Select category</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder="e.g., Software Development"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <LocationDropdownsString
              country={formData.country}
              state={formData.state}
              city={formData.city}
              onCountryChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              onStateChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
              onCityChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Arrangement</label>
              <select
                name="remote_type"
                value={formData.remote_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
              >
                <option value="on-site">On-Site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
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
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          {formData.work_type === 'contract' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contract Length</label>
              <input
                type="text"
                name="contract_length"
                value={formData.contract_length}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder="e.g., 6 months, 12 months"
              />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary Min</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary Max</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder="70000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                name="salary_currency"
                value={formData.salary_currency}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
              >
                <option value="USD">USD</option>
                <option value="AUD">AUD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="has_bonus"
                checked={formData.has_bonus}
                onChange={handleChange}
                className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
              />
              <span className="text-sm text-gray-700">Bonus available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="has_commission"
                checked={formData.has_commission}
                onChange={handleChange}
                className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
              />
              <span className="text-sm text-gray-700">Commission available</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Pattern</label>
            <input
              type="text"
              name="schedule_pattern"
              value={formData.schedule_pattern}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="e.g., Monday-Friday, 9am-5pm"
            />
          </div>
        </section>

        {/* B) Business Context - Read-only display */}
        {businessData && (
          <section className="dashboard-card rounded-xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">B) Business Context</h2>
            <p className="text-sm text-gray-600 italic">This information is pulled from your Business Profile</p>
            
            {businessData.bio && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Business Summary</h3>
                <p className="text-gray-600">{businessData.bio}</p>
              </div>
            )}

            {businessData.cultureTags && businessData.cultureTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Culture Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {businessData.cultureTags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {businessData.benefits && businessData.benefits.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Benefits</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {businessData.benefits.map((benefit: string, idx: number) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {businessData.media && businessData.media.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Media</h3>
                <p className="text-sm text-gray-600">{businessData.media.length} media item(s) from Business Bank</p>
              </div>
            )}
          </section>
        )}

        {/* C) Role Details */}
        <section className="dashboard-card rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">C) Role Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Summary</label>
            <textarea
              name="role_summary"
              value={formData.role_summary}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="Overview of the role and its purpose..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
            <textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="List key responsibilities (one per line or use bullet points)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Success Outcomes</label>
            <textarea
              name="success_outcomes"
              value={formData.success_outcomes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="What success looks like in this role..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tools & Systems</label>
            <textarea
              name="tools_systems"
              value={formData.tools_systems}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="Technologies, software, or systems used..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Growth & Progression</label>
            <textarea
              name="growth_progression"
              value={formData.growth_progression}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="Career development opportunities..."
            />
          </div>
        </section>

        {/* D) Requirements */}
        <section className="dashboard-card rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">D) Requirements</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.skill_input}
                onChange={(e) => setFormData(prev => ({ ...prev, skill_input: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSkillAdd()
                  }
                }}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
                placeholder="Type a skill and press Enter"
              />
              <button
                type="button"
                onClick={handleSkillAdd}
                className="px-4 py-3 bg-[#20C997] text-white rounded-lg hover:bg-[#1DB886] transition-colors"
              >
                Add
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
              >
                <option value="">Select level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education Level (Optional)</label>
              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-[#20C997]"
              >
                <option value="">Not required</option>
                <option value="high-school">High School</option>
                <option value="certificate">Certificate</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Licences / Accreditations</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checks Required</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {checkOptions.map((check) => (
                <label key={check} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.checks.includes(check)}
                    onChange={() => handleCheckChange(check)}
                    className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
                  />
                  <span className="text-sm text-gray-700">{check}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* E) Application Settings */}
        <section className="dashboard-card rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">E) Application Settings</h2>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="apply_via_creerlio"
              checked={formData.apply_via_creerlio}
              onChange={handleChange}
              className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
            />
            <label className="text-sm font-medium text-gray-700">Apply via Creerlio (default)</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">External Application Link (Optional)</label>
            <input
              type="url"
              name="external_link"
              value={formData.external_link}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="https://example.com/apply"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Screening Questions (Optional)</label>
            <textarea
              name="screening_questions"
              value={formData.screening_questions}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="Add any screening questions for applicants..."
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="portfolio_required"
                checked={formData.portfolio_required}
                onChange={handleChange}
                className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
              />
              <span className="text-sm font-medium text-gray-700">Portfolio required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="cover_note_optional"
                checked={formData.cover_note_optional}
                onChange={handleChange}
                className="w-4 h-4 text-[#20C997] border-gray-300 rounded focus:ring-[#20C997]"
              />
              <span className="text-sm font-medium text-gray-700">Cover note optional</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Notice (Optional)</label>
            <textarea
              name="privacy_notice"
              value={formData.privacy_notice}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#20C997]"
              placeholder="Privacy information for applicants..."
            />
          </div>
        </section>

        {/* Status */}
        <section className="dashboard-card rounded-xl p-8">
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
        </section>

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
