'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LocationDropdownsString from '@/components/LocationDropdownsString'

// Helper function to geocode location using Mapbox
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token || !location.trim()) return null

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}&limit=1&country=AU`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

type TalentProfileRow = Record<string, any>

function pickTalentName(row: TalentProfileRow | null): string {
  if (!row) return ''
  return (
    (typeof row?.name === 'string' && row.name) ||
    (typeof row?.talent_name === 'string' && row.talent_name) ||
    (typeof row?.full_name === 'string' && row.full_name) ||
    (typeof row?.display_name === 'string' && row.display_name) ||
    ''
  )
}

export default function EditTalentProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<TalentProfileRow | null>(null)
  const [talentId, setTalentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    headline: '',
    bio: '',
    skills: '',
    location: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    search_visible: false,
    search_summary: '',
    availability_description: '',
  })

  useEffect(() => {
    // Force Talent mode when entering Talent profile editor (supports mixed-profile users)
    try {
      localStorage.setItem('creerlio_active_role', 'talent')
      localStorage.setItem('user_type', 'talent')
    } catch {}

    let cancelled = false
    async function load() {
      setIsLoading(true)
      setErrors({})
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const uid = sessionRes.session?.user?.id ?? null
        const email = sessionRes.session?.user?.email ?? null
        if (!uid) {
          router.push('/login?redirect=/dashboard/talent/edit')
          return
        }

        // Load by user_id (canonical for Supabase auth)
        const existing = await supabase.from('talent_profiles').select('*').eq('user_id', uid).maybeSingle()
        if (existing.error) {
          setErrors({ submit: existing.error.message })
          return
        }

        if (!existing.data) {
          // Empty state: no profile yet; user can create one.
          if (!cancelled) {
            setProfile(null)
            setTalentId(null)
            setFormData((p) => ({ ...p, name: '', headline: '', bio: '', skills: '' }))
          }
          return
        }

        const row: any = existing.data
        if (!cancelled) {
          setProfile(row)
          setTalentId(String(row.id))
          setFormData({
            name: pickTalentName(row),
            title: (typeof row.title === 'string' && row.title) || '',
            headline: (typeof row.headline === 'string' && row.headline) || '',
            bio: (typeof row.bio === 'string' && row.bio) || '',
            skills:
              Array.isArray(row.skills) ? row.skills.join(', ') : typeof row.skills === 'string' ? row.skills : '',
            location: (typeof row.location === 'string' && row.location) || '',
            city: (typeof row.city === 'string' && row.city) || '',
            state: (typeof row.state === 'string' && row.state) || '',
            country: (typeof row.country === 'string' && row.country) || '',
            phone: (typeof row.phone === 'string' && row.phone) || '',
            search_visible: typeof row.search_visible === 'boolean' ? row.search_visible : false,
            search_summary: (typeof row.search_summary === 'string' && row.search_summary) || '',
            availability_description: (typeof row.availability_description === 'string' && row.availability_description) || '',
          })
        }

        // Keep legacy localStorage email for older pages that still reference it
        if (email) {
          try {
            localStorage.setItem('user_email', email)
          } catch {}
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  async function createProfile() {
    setIsSaving(true)
    setErrors({})
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      const email = sessionRes.session?.user?.email ?? null
      if (!uid) {
        router.push('/login?redirect=/dashboard/talent/edit')
        return
      }

      const isMissingColumnErr = (err: any) => {
        return err?.code === 'PGRST204' || /Could not find the .* column/i.test(err?.message ?? '')
      }

      const base: Record<string, any> = { user_id: uid }
      if (email) base.email = email

      // 1) Create with the "name" field (schema varies across environments)
      const nameKeyCandidates = ['name', 'talent_name', 'full_name', 'display_name']
      let createdId: string | null = null
      let lastErr: any = null

      for (const key of nameKeyCandidates) {
        const payload: Record<string, any> = { ...base }
        if (formData.name.trim()) payload[key] = formData.name.trim()
        const ins = await supabase.from('talent_profiles').insert(payload).select('id').maybeSingle()
        if (!ins.error && ins.data?.id) {
          createdId = String(ins.data.id)
          break
        }
        lastErr = ins.error
        if (!isMissingColumnErr(ins.error)) break
      }

      if (!createdId) {
        setErrors({
          submit:
            lastErr?.message ||
            'Could not create Talent profile. (Check Supabase RLS policies for talent_profiles inserts.)',
        })
        return
      }

      // 2) Update all fields in a single query (including location fields even if empty)
      const skills = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const updateData: Record<string, any> = {
        headline: formData.headline.trim() || null,
        title: formData.title.trim() || null,
        bio: formData.bio.trim() || null,
        skills: skills.length ? skills : null,
        location: formData.location.trim() || null,
        // Always include location fields (country, state, city) even if empty
        country: formData.country.trim() || null,
        state: formData.state.trim() || null,
        city: formData.city.trim() || null,
        phone: formData.phone.trim() || null,
      }

      // Geocode location if city, state, or country are provided
      if (updateData.city || updateData.state || updateData.country) {
        try {
          const locationParts = [updateData.city, updateData.state, updateData.country].filter(Boolean)
          if (locationParts.length > 0) {
            const locationString = locationParts.join(', ')
            const geocodeResult = await geocodeLocation(locationString)
            if (geocodeResult) {
              updateData.latitude = geocodeResult.lat
              updateData.longitude = geocodeResult.lng
            }
          }
        } catch (err) {
          console.warn('Geocoding failed, continuing without coordinates:', err)
          // Continue saving without coordinates - they can be added later
        }
      }

      // Do a single update with all fields
      const upd = await supabase.from('talent_profiles').update(updateData).eq('id', createdId)
      if (upd.error && !isMissingColumnErr(upd.error)) {
        console.error('Error updating profile fields:', upd.error)
        // Continue anyway - the profile was created successfully
      }

      setTalentId(createdId)
      router.push('/dashboard/talent')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      setIsSaving(false)
      return
    }

    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id ?? null
      if (!uid) {
        router.push('/login?redirect=/dashboard/talent/edit')
        return
      }

      const skills = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const isMissingColumnErr = (err: any) => {
        return err?.code === 'PGRST204' || /Could not find the .* column/i.test(err?.message ?? '')
      }

      // Ensure we have an existing row; if not, create first.
      if (!talentId) {
        await createProfile()
        return
      }

      // Name column varies: try candidates first
      const nameKeyCandidates = ['name', 'talent_name', 'full_name', 'display_name']
      let nameOk = false
      let lastNameErr: any = null
      for (const key of nameKeyCandidates) {
        const res = await supabase.from('talent_profiles').update({ [key]: formData.name.trim() }).eq('id', talentId)
        if (!res.error) {
          nameOk = true
          break
        }
        lastNameErr = res.error
        if (!isMissingColumnErr(res.error)) break
      }
      if (!nameOk && lastNameErr) {
        setErrors({ submit: lastNameErr.message })
        return
      }

      // Build update object with all fields (including empty strings for location fields)
      const updateData: Record<string, any> = {}
      
      // Add optional fields only if they exist in schema
      // Validate search summary if search_visible is true
      if (formData.search_visible && !formData.search_summary.trim()) {
        setErrors({ search_summary: 'Search summary is required when profile is visible to businesses' })
        setIsSaving(false)
        return
      }

      const optionalFields = [
        { k: 'headline', v: formData.headline.trim() || null },
        { k: 'title', v: formData.title.trim() || null },
        { k: 'bio', v: formData.bio.trim() || null },
        { k: 'skills', v: skills.length > 0 ? skills : null },
        { k: 'location', v: formData.location.trim() || null },
        { k: 'phone', v: formData.phone.trim() || null },
      ]

      // Always include location fields (country, state, city) even if empty
      // This ensures they can be cleared/set properly
      updateData.country = formData.country.trim() || null
      updateData.state = formData.state.trim() || null
      updateData.city = formData.city.trim() || null

      // Include search visibility and summary fields
      updateData.search_visible = formData.search_visible || false
      updateData.search_summary = formData.search_visible ? (formData.search_summary.trim() || null) : null
      updateData.availability_description = formData.availability_description.trim() || null

      // Geocode location if city, state, or country are provided
      if (updateData.city || updateData.state || updateData.country) {
        try {
          const locationParts = [updateData.city, updateData.state, updateData.country].filter(Boolean)
          if (locationParts.length > 0) {
            const locationString = locationParts.join(', ')
            const geocodeResult = await geocodeLocation(locationString)
            if (geocodeResult) {
              updateData.latitude = geocodeResult.lat
              updateData.longitude = geocodeResult.lng
            }
          }
        } catch (err) {
          console.warn('Geocoding failed, continuing without coordinates:', err)
          // Continue saving without coordinates - they can be added later
        }
      } else {
        // Clear coordinates if location fields are cleared
        updateData.latitude = null
        updateData.longitude = null
      }

      // Add other optional fields
      for (const f of optionalFields) {
        if (f.v !== null && f.v !== undefined) {
          updateData[f.k] = f.v
        }
      }

      // Do a single update with all fields
      const res = await supabase.from('talent_profiles').update(updateData).eq('id', talentId)
      
      if (res.error && !isMissingColumnErr(res.error)) {
        setErrors({ submit: res.error.message || 'Failed to update profile. Please try again.' })
        setIsSaving(false)
        return
      }

      router.push('/dashboard/talent')
    } catch (error: any) {
      setErrors({
        submit: error?.message || 'Failed to update profile. Please try again.'
      })
    } finally {
      setIsSaving(false)
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
        <Link href="/dashboard/talent" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <Link
          href="/dashboard/talent"
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
        >
          Back to Dashboard
        </Link>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="dashboard-card rounded-xl p-8 space-y-6">
          {!profile && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-100">
              <div className="font-semibold text-white">No Talent profile found yet</div>
              <div className="text-sm text-blue-100/90 mt-1">
                Fill in your details below, then click <span className="font-semibold">Create Profile</span>.
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={createProfile}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-60"
                >
                  Create Profile
                </button>
              </div>
            </div>
          )}
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none transition-colors ${
                errors.name ? 'border-red-500' : 'border-blue-500/20 focus:border-blue-500'
              }`}
              placeholder="Your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Professional Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
            <input
              type="text"
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Hospitality • Customer service • Ready to start"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="JavaScript, React, Node.js, Python"
            />
          </div>

          {/* Location */}
          <LocationDropdownsString
            country={formData.country || ''}
            state={formData.state || ''}
            city={formData.city || ''}
            onCountryChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
            onStateChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
            onCityChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
          />

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Business Search Visibility Section */}
          <div className="border-t border-gray-700 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Business Search Visibility</h3>
            <p className="text-sm text-gray-400 mb-4">
              Control whether your profile is visible to businesses searching for talent. When enabled, businesses will see a brief summary you write (not your full profile) and can request a connection.
            </p>

            {/* Search Visible Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.search_visible}
                  onChange={(e) => setFormData(prev => ({ ...prev, search_visible: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 bg-white text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">
                  Make my profile visible to businesses in search
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-8">
                When enabled, businesses can find you on the Business Map and see your search summary below
              </p>
            </div>

            {/* Search Summary */}
            {formData.search_visible && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Search Summary <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Write a brief summary that businesses will see when searching for talent. Include your role, experience, location, and what you're looking for. Example: "Actor with 10 years experience, lives in Sydney, looking for acting roles in the next 3 months"
                  </p>
                  <textarea
                    name="search_summary"
                    value={formData.search_summary}
                    onChange={handleChange}
                    required={formData.search_visible}
                    maxLength={500}
                    rows={4}
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-y ${
                      errors.search_summary ? 'border-red-500' : 'border-blue-500/20'
                    }`}
                    placeholder="e.g., Actor with 10 years experience, lives in Sydney, looking for acting roles in the next 3 months"
                  />
                  <p className={`text-xs mt-1 ${formData.search_summary.length >= 500 ? 'text-red-400' : 'text-gray-400'}`}>
                    {formData.search_summary.length} / 500 characters
                  </p>
                  {errors.search_summary && <p className="mt-1 text-sm text-red-400">{errors.search_summary}</p>}
                </div>

                {/* Availability Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Availability Description (Optional)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Additional details about when you're looking for roles, availability, or preferences
                  </p>
                  <textarea
                    name="availability_description"
                    value={formData.availability_description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-y"
                    placeholder="e.g., Looking for acting roles in the next 3 months, available for auditions on weekends"
                  />
                </div>
              </>
            )}
          </div>

          {/* Error Messages */}
          {(errors.submit || errors.search_summary) && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              {errors.submit && <p className="text-sm text-red-400">{errors.submit}</p>}
              {errors.search_summary && <p className="text-sm text-red-400">{errors.search_summary}</p>}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <Link
              href="/dashboard/talent"
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
