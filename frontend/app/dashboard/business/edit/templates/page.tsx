'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TemplateSelector from '@/components/TemplateSelector'
import { supabase } from '@/lib/supabase'
import { TemplateId } from '@/components/portfolioTemplates'

export default function BusinessProfileTemplatesPage() {
  const router = useRouter()
  const [currentTemplateId, setCurrentTemplateId] = useState<TemplateId | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplateId()
  }, [])

  const loadTemplateId = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        router.push('/login/business')
        return
      }

      const uid = session.user.id

      // Load existing business profile data to get current template
      const { data: bankData } = await supabase
        .from('business_bank_items')
        .select('metadata')
        .eq('user_id', uid)
        .eq('item_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (bankData?.metadata && (bankData.metadata as any).selected_template_id) {
        setCurrentTemplateId((bankData.metadata as any).selected_template_id)
      }
    } catch (error) {
      console.error('Error loading template ID:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = async (templateId: TemplateId) => {
    try {
      setSaving(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        alert('Please sign in to select a template.')
        return
      }

      const uid = session.user.id

      // Get existing profile data
      const { data: existing } = await supabase
        .from('business_bank_items')
        .select('id, metadata')
        .eq('user_id', uid)
        .eq('item_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const currentMetadata = existing?.metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        selected_template_id: templateId,
      }

      if (existing?.id) {
        // Update existing
        const { error } = await supabase
          .from('business_bank_items')
          .update({ metadata: updatedMetadata })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('business_bank_items')
          .insert({
            user_id: uid,
            item_type: 'profile',
            title: 'Profile',
            metadata: updatedMetadata,
          })

        if (error) throw error
      }

      setCurrentTemplateId(templateId)
      // Redirect back to edit page
      router.push('/dashboard/business/edit')
    } catch (error: any) {
      console.error('Error saving template:', error)
      alert(`Failed to save template: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading templates...</p>
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
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/business/edit"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                ← Back to Edit Profile
              </Link>
              <Link
                href="/dashboard/business"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Template Selector */}
      <main>
        {saving && (
          <div className="fixed top-20 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            Template saved! ✓
          </div>
        )}
        <TemplateSelector
          shareConfig={null}
          currentTemplateId={currentTemplateId}
          onSelect={handleTemplateSelect}
          onClose={() => router.push('/dashboard/business/edit')}
        />
      </main>
    </div>
  )
}
