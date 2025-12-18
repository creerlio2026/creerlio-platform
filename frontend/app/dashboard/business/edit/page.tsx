'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface BusinessProfile {
  id: number
  name: string
  description: string | null
  industry: string | null
  website: string | null
  location: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
}

export default function EditBusinessProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    location: '',
    city: '',
    state: '',
    country: '',
    phone: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')

    if (!token || !email) {
      router.push('/login')
      return
    }

    fetchProfile(email)
  }, [router])

  const fetchProfile = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.get(`${apiUrl}/api/business/me`, {
        params: { email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (response.data) {
        setProfile(response.data)
        setFormData({
          name: response.data.name || '',
          description: response.data.description || '',
          industry: response.data.industry || '',
          website: response.data.website || '',
          location: response.data.location || '',
          city: response.data.city || '',
          state: response.data.state || '',
          country: response.data.country || '',
          phone: response.data.phone || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Business name is required' })
      setIsSaving(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const email = localStorage.getItem('user_email')

      const response = await axios.put(
        `${apiUrl}/api/business/me`,
        {
          name: formData.name,
          description: formData.description || null,
          industry: formData.industry || null,
          website: formData.website || null,
          location: formData.location || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          phone: formData.phone || null
        },
        {
          params: { email },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      )

      if (response.data.success) {
        router.push('/dashboard/business')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setErrors({
        submit: error.response?.data?.detail || 'Failed to update profile. Please try again.'
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
        <h1 className="text-4xl font-bold text-white mb-8">Edit Business Profile</h1>

        <form onSubmit={handleSubmit} className="dashboard-card rounded-xl p-8 space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Name <span className="text-red-400">*</span>
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
              placeholder="Your business name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Describe your business..."
            />
          </div>

          {/* Industry & Website */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-blue-500/20 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>
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
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
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
