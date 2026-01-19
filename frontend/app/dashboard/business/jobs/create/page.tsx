'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BasicJobForm from '@/components/jobs/BasicJobForm'
import AdvancedJobForm from '@/components/jobs/AdvancedJobForm'

export const dynamic = 'force-dynamic'

interface BusinessProfile {
  id: string
  name: string | null
}

type JobPostType = 'basic' | 'advanced' | null

export default function CreateJobPage() {
  return (
    <Suspense fallback={null}>
      <CreateJobPageInner />
    </Suspense>
  )
}

function CreateJobPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<JobPostType>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const uid = data.session?.user?.id ?? null
        if (!uid) {
          router.push('/login?redirect=/dashboard/business/jobs/create')
          return
        }

        // Determine business profile (schema-tolerant)
        const selectors = ['id, name', 'id, company_name', 'id, business_name']
        let row: any = null
        for (const sel of selectors) {
          const res: any = await (supabase.from('business_profiles').select(sel) as any).eq('user_id', uid).maybeSingle()
          if (!res.error && res.data) {
            row = res.data
            break
          }
        }

        if (!row) {
          router.push('/dashboard/business')
          return
        }

        if (cancelled) return
        setBusinessProfile({
          id: String(row.id),
          name:
            (typeof row.name === 'string' && row.name) ||
            (typeof row.company_name === 'string' && row.company_name) ||
            (typeof row.business_name === 'string' && row.business_name) ||
            null,
        })

        // Check if template type is specified in URL
        const templateParam = searchParams?.get('template')
        if (templateParam === 'basic' || templateParam === 'advanced') {
          setSelectedTemplate(templateParam)
        }
      } catch (e) {
        console.error('Error loading business profile:', e)
        router.push('/login?redirect=/dashboard/business/jobs/create')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#20C997] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Template Selection Screen
  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-black border-0">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <Link href="/dashboard/business" className="flex items-center space-x-2">
              <div className="px-4 py-2 rounded-full bg-[#20C997] text-white text-base font-bold">
                C
              </div>
              <span className="text-white text-2xl font-bold">Creerlio</span>
            </Link>
            <Link
              href="/dashboard/business"
              className="px-4 py-2 text-white hover:text-[#20C997] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Job Posting</h1>
          <p className="text-gray-600 mb-8">Choose a template to get started</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Job Post */}
            <button
              onClick={() => setSelectedTemplate('basic')}
              className="dashboard-card rounded-xl p-8 text-left hover:border-[#20C997] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#20C997] transition-colors">
                  Quick Post (Basic)
                </h2>
                <div className="text-3xl">⚡</div>
              </div>
              <p className="text-gray-600 mb-6">
                Fast, minimal form for small businesses. Get your job posted in minutes.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Essential fields only</p>
                <p>✓ Quick setup</p>
                <p>✓ Perfect for simple roles</p>
              </div>
            </button>

            {/* Advanced Job Post */}
            <button
              onClick={() => setSelectedTemplate('advanced')}
              className="dashboard-card rounded-xl p-8 text-left hover:border-[#20C997] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#20C997] transition-colors">
                  Detailed Post (Advanced)
                </h2>
                <div className="text-3xl">📋</div>
              </div>
              <p className="text-gray-600 mb-6">
                Comprehensive, enterprise-grade posting with detailed sections and requirements.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ Full job details</p>
                <p>✓ Multiple sections</p>
                <p>✓ Advanced filtering options</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Ensure business profile exists before rendering form
  if (!businessProfile || !businessProfile.id) {
    router.push('/dashboard/business')
    return null
  }

  // Render selected form
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black border-0">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard/business" className="flex items-center space-x-2">
            <div className="px-4 py-2 rounded-full bg-[#20C997] text-white text-base font-bold">
              C
            </div>
            <span className="text-white text-2xl font-bold">Creerlio</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="px-4 py-2 text-white hover:text-[#20C997] transition-colors"
            >
              ← Choose Template
            </button>
            <Link
              href="/dashboard/business"
              className="px-4 py-2 text-white hover:text-[#20C997] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {selectedTemplate === 'basic' ? (
          <BasicJobForm businessProfile={businessProfile} />
        ) : (
          <AdvancedJobForm businessProfile={businessProfile} />
        )}
      </div>
    </div>
  )
}
