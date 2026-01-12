/**
 * Template View Component
 * 
 * Displays portfolio content in a selected template with template-specific styling
 * Initially shows ALL content
 * Supports edit mode with select/deselect controls
 * Live preview updates in real-time
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { PortfolioTemplate, getTemplateById, TemplateId } from './portfolioTemplates'
import { supabase } from '@/lib/supabase'
import TemplateLayoutRenderer from './template-layouts/TemplateLayoutRenderer'

interface TemplateViewPortfolioData {
  name: string
  title: string
  bio: string
  avatar_path?: string | null
  banner_path?: string | null
  introVideoId?: number | null
  socialLinks?: Array<{ platform: string; url: string }>
  skills?: string[]
  experience?: Array<any>
  education?: Array<any>
  referees?: Array<any>
  projects?: Array<any>
  attachments?: Array<any>
  family_community?: { imageIds?: number[]; descriptions?: Record<number, string> }
  sectionOrder?: string[]
}

interface TemplateViewProps {
  templateId: TemplateId
  portfolioData: TemplateViewPortfolioData
  initialTemplateState?: TemplateState | null
  onClose: () => void
  onSelectDifferentTemplate?: () => void
}

interface TemplateState {
  template_id: TemplateId
  included_sections: string[]
  selected_items: {
    skills: number[]
    experience: number[]
    education: number[]
    referees: number[]
    projects: number[]
    attachments: number[]
    family_community: number[]
  }
  section_order: string[]
  include_avatar: boolean
  include_banner: boolean
  include_intro_video: boolean
}

// Template-specific color schemes
function getTemplateColors(category: string) {
  switch (category) {
    case 'Creative':
      return {
        primary: 'from-purple-600 to-pink-600',
        accent: 'purple',
        bg: 'from-slate-950 via-purple-950/20 to-slate-900',
        card: 'bg-purple-950/30 border-purple-500/20',
        text: 'text-purple-100',
      }
    case 'Technology':
      return {
        primary: 'from-green-600 to-emerald-600',
        accent: 'green',
        bg: 'from-slate-950 via-green-950/20 to-slate-900',
        card: 'bg-green-950/30 border-green-500/20',
        text: 'text-green-100',
      }
    case 'Business':
      return {
        primary: 'from-blue-600 to-cyan-600',
        accent: 'blue',
        bg: 'from-slate-950 via-blue-950/20 to-slate-900',
        card: 'bg-blue-950/30 border-blue-500/20',
        text: 'text-blue-100',
      }
    case 'Healthcare':
      return {
        primary: 'from-red-600 to-rose-600',
        accent: 'red',
        bg: 'from-slate-950 via-red-950/20 to-slate-900',
        card: 'bg-red-950/30 border-red-500/20',
        text: 'text-red-100',
      }
    case 'Education':
      return {
        primary: 'from-amber-600 to-orange-600',
        accent: 'amber',
        bg: 'from-slate-950 via-amber-950/20 to-slate-900',
        card: 'bg-amber-950/30 border-amber-500/20',
        text: 'text-amber-100',
      }
    case 'Hospitality':
      return {
        primary: 'from-orange-600 to-yellow-600',
        accent: 'orange',
        bg: 'from-slate-950 via-orange-950/20 to-slate-900',
        card: 'bg-orange-950/30 border-orange-500/20',
        text: 'text-orange-100',
      }
    case 'Science':
      return {
        primary: 'from-indigo-600 to-violet-600',
        accent: 'indigo',
        bg: 'from-slate-950 via-indigo-950/20 to-slate-900',
        card: 'bg-indigo-950/30 border-indigo-500/20',
        text: 'text-indigo-100',
      }
    default:
      return {
        primary: 'from-slate-600 to-gray-600',
        accent: 'slate',
        bg: 'from-slate-950 via-slate-900 to-slate-800',
        card: 'bg-slate-900/40 border-white/10',
        text: 'text-slate-100',
      }
  }
}

export default function TemplateView({ templateId, portfolioData, initialTemplateState, onClose, onSelectDifferentTemplate }: TemplateViewProps) {
  // Initialize template immediately
  const template = getTemplateById(templateId) || null
  
  // Initialize default state immediately with ALL items selected
  const getInitialState = (): TemplateState => {
    const allSkills = (portfolioData.skills || []).map((_, i) => i)
    const allExperience = (portfolioData.experience || []).map((_, i) => i)
    const allEducation = (portfolioData.education || []).map((_, i) => i)
    const allReferees = (portfolioData.referees || []).map((_, i) => i)
    const allProjects = (portfolioData.projects || []).map((_, i) => i)
    const allAttachments = (portfolioData.attachments || []).map((_, i) => i)

    return {
      template_id: templateId,
      included_sections: ['intro', 'social', 'skills', 'experience', 'education', 'referees', 'projects', 'attachments', 'family_community'],
      selected_items: {
        skills: allSkills,
        experience: allExperience,
        education: allEducation,
        referees: allReferees,
        projects: allProjects,
        attachments: allAttachments,
        family_community: (portfolioData.family_community?.imageIds || []).map((_, i) => i),
      },
      section_order: portfolioData.sectionOrder || ['intro', 'social', 'skills', 'experience', 'education', 'referees', 'projects', 'attachments', 'family_community'],
      include_avatar: true,
      include_banner: true,
      include_intro_video: true,
    }
  }

  const [editMode, setEditMode] = useState(false)
  const [templateState, setTemplateState] = useState<TemplateState>(getInitialState())
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)
  const [attachmentUrls, setAttachmentUrls] = useState<Record<number, string>>({})
  const [attachmentItemUrls, setAttachmentItemUrls] = useState<Record<number, string>>({})
  const [familyCommunityUrls, setFamilyCommunityUrls] = useState<Record<number, string>>({})
  const [tbItemCache, setTbItemCache] = useState<Record<number, any>>({})
  const [localFamilyCommunityDescriptions, setLocalFamilyCommunityDescriptions] = useState<Record<number, string>>({})
  const [localBio, setLocalBio] = useState<string>(portfolioData.bio || '')
  const [expandedTextareas, setExpandedTextareas] = useState<Record<string, boolean>>({})

  const colors = useMemo(() => {
    return template ? getTemplateColors(template.category) : getTemplateColors('')
  }, [templateId])

  const getCardClass = () => {
    if (colors.accent === 'purple') return 'bg-purple-950/30 border-purple-500/20'
    if (colors.accent === 'green') return 'bg-green-950/30 border-green-500/20'
    if (colors.accent === 'blue') return 'bg-blue-950/30 border-blue-500/20'
    if (colors.accent === 'red') return 'bg-red-950/30 border-red-500/20'
    if (colors.accent === 'amber') return 'bg-amber-950/30 border-amber-500/20'
    if (colors.accent === 'orange') return 'bg-orange-950/30 border-orange-500/20'
    if (colors.accent === 'indigo') return 'bg-indigo-950/30 border-indigo-500/20'
    return 'bg-slate-900/40 border-white/10'
  }

  const getTextClass = () => {
    if (colors.accent === 'purple') return 'text-purple-100'
    if (colors.accent === 'green') return 'text-green-100'
    if (colors.accent === 'blue') return 'text-blue-100'
    if (colors.accent === 'red') return 'text-red-100'
    if (colors.accent === 'amber') return 'text-amber-100'
    if (colors.accent === 'orange') return 'text-orange-100'
    if (colors.accent === 'indigo') return 'text-indigo-100'
    return 'text-slate-100'
  }

  // Load saved state and media when template or portfolio data changes
  useEffect(() => {
    // If initialTemplateState is provided (from saved template), use it directly
    if (initialTemplateState) {
      setTemplateState(initialTemplateState)
    } else {
      // Otherwise, reset to default and load from portfolio metadata
      setTemplateState(getInitialState())
    }
    
    // Initialize local descriptions from portfolio data
    if (portfolioData.family_community?.descriptions) {
      setLocalFamilyCommunityDescriptions(portfolioData.family_community.descriptions)
    } else {
      setLocalFamilyCommunityDescriptions({})
    }
    
    // Initialize local bio from portfolio data
    setLocalBio(portfolioData.bio || '')
    
    // Load saved state and media in background (non-blocking)
    // Only load from portfolio metadata if no initialTemplateState was provided
    if (!initialTemplateState) {
      loadTemplateState()
    }
    loadMediaUrls()
    loadAttachmentData()
    loadFamilyCommunityData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, portfolioData, initialTemplateState])

  async function loadTemplateState() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        return
      }

      const { data } = await supabase
        .from('talent_bank_items')
        .select('metadata')
        .eq('user_id', session.user.id)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const meta = data?.metadata as any
      const savedState = meta?.template_states?.[templateId]

      // If saved state exists, merge it with defaults; otherwise keep default state
      if (savedState) {
        const initialState = getInitialState()
        setTemplateState({
          ...initialState,
          ...savedState,
          // Merge selected_items to ensure all fields exist (for backward compatibility)
          selected_items: {
            ...initialState.selected_items,
            ...(savedState.selected_items || {}),
            // Ensure family_community exists even if not in saved state
            family_community: savedState.selected_items?.family_community ?? initialState.selected_items.family_community,
          },
          // Ensure media flags exist (for backward compatibility)
          include_avatar: savedState.include_avatar !== undefined ? savedState.include_avatar : initialState.include_avatar,
          include_banner: savedState.include_banner !== undefined ? savedState.include_banner : initialState.include_banner,
          include_intro_video: savedState.include_intro_video !== undefined ? savedState.include_intro_video : initialState.include_intro_video,
        })
      }
    } catch (error) {
      console.error('Error loading template state:', error)
      // Keep default state if load fails
    }
  }


  async function loadMediaUrls() {
    if (portfolioData.avatar_path) {
      const { data } = await supabase.storage
        .from('talent-bank')
        .createSignedUrl(portfolioData.avatar_path, 3600)
      if (data) setAvatarUrl(data.signedUrl)
    }

    if (portfolioData.banner_path) {
      const { data } = await supabase.storage
        .from('talent-bank')
        .createSignedUrl(portfolioData.banner_path, 3600)
      if (data) setBannerUrl(data.signedUrl)
    }

    if (portfolioData.introVideoId) {
      const { data: videoItem } = await supabase
        .from('talent_bank_items')
        .select('file_path')
        .eq('id', portfolioData.introVideoId)
        .maybeSingle()
      
      if (videoItem?.file_path) {
        const { data } = await supabase.storage
          .from('talent-bank')
          .createSignedUrl(videoItem.file_path, 3600)
        if (data) setIntroVideoUrl(data.signedUrl)
      }
    }

    // Load attachment URLs
    if (portfolioData.attachments) {
      const urls: Record<number, string> = {}
      for (let i = 0; i < portfolioData.attachments.length; i++) {
        const att = portfolioData.attachments[i]
        if (att.file_path) {
          const { data } = await supabase.storage
            .from('talent-bank')
            .createSignedUrl(att.file_path, 3600)
          if (data) urls[i] = data.signedUrl
        }
      }
      setAttachmentUrls(urls)
    }
  }

  async function loadAttachmentData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return

      const ids = new Set<number>()
      
      // Collect all attachment IDs from education, projects, referees, and experience
      for (const e of portfolioData.education || []) {
        const a = Array.isArray(e?.attachmentIds) ? e.attachmentIds : []
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      for (const p of portfolioData.projects || []) {
        const a = Array.isArray(p?.attachmentIds) ? p.attachmentIds : []
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      for (const r of portfolioData.referees || []) {
        const a = Array.isArray(r?.attachmentIds) ? r.attachmentIds : []
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      for (const e of portfolioData.experience || []) {
        const a = Array.isArray(e?.attachmentIds) ? e.attachmentIds : []
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      const missing = Array.from(ids).filter((id) => !tbItemCache[id])
      if (!missing.length) return

      const { data } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type')
        .eq('user_id', session.user.id)
        .in('id', missing)

      const next: Record<number, any> = {}
      for (const it of data ?? []) next[(it as any).id] = it
      if (Object.keys(next).length) {
        setTbItemCache((prev) => ({ ...prev, ...next }))
        
        // Create signed URLs for these items
        const urls: Record<number, string> = {}
        for (const it of data ?? []) {
          if (it.file_path) {
            const { data: urlData } = await supabase.storage
              .from('talent-bank')
              .createSignedUrl(it.file_path, 3600)
            if (urlData) urls[it.id] = urlData.signedUrl
          }
        }
        if (Object.keys(urls).length) {
          setAttachmentItemUrls((prev) => ({ ...prev, ...urls }))
        }
      }
    } catch (error) {
      console.error('Error loading attachment data:', error)
    }
  }

  async function loadFamilyCommunityData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return

      const imageIds = portfolioData.family_community?.imageIds || []
      if (!imageIds.length) return

      // Load talent bank items for family community images
      const ids = imageIds.filter((id: any) => {
        const n = Number(id)
        return Number.isFinite(n) && n > 0
      })
      if (!ids.length) return

      const missing = ids.filter((id) => !tbItemCache[id])
      if (missing.length) {
        const { data } = await supabase
          .from('talent_bank_items')
          .select('id,item_type,title,metadata,file_path,file_type')
          .eq('user_id', session.user.id)
          .in('id', missing)

        const next: Record<number, any> = {}
        for (const it of data ?? []) next[(it as any).id] = it
        if (Object.keys(next).length) {
          setTbItemCache((prev) => ({ ...prev, ...next }))
          
          // After loading items, load URLs
          const urls: Record<number, string> = {}
          for (const id of ids) {
            const item = next[id] || tbItemCache[id]
            if (item?.file_path) {
              const { data: urlData } = await supabase.storage
                .from('talent-bank')
                .createSignedUrl(item.file_path, 3600)
              if (urlData) urls[id] = urlData.signedUrl
            }
          }
          setFamilyCommunityUrls(urls)
        }
      } else {
        // Items already in cache, just load URLs
        const urls: Record<number, string> = {}
        for (const id of ids) {
          const item = tbItemCache[id]
          if (item?.file_path) {
            const { data: urlData } = await supabase.storage
              .from('talent-bank')
              .createSignedUrl(item.file_path, 3600)
            if (urlData) urls[id] = urlData.signedUrl
          }
        }
        setFamilyCommunityUrls(urls)
      }
    } catch (error) {
      console.error('Error loading family community data:', error)
    }
  }

  async function saveTemplateState() {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        alert('Please sign in to save')
        return
      }

      // Ask user if they want to save as a named template
      const saveAsNamed = window.confirm('Save as named template? (Cancel to save as default)')
      let templateName: string | null = null
      
      if (saveAsNamed) {
        templateName = window.prompt('Enter a name for this template configuration:') || null
        if (!templateName || !templateName.trim()) {
          setSaving(false)
          return // User cancelled or entered empty name
        }
        templateName = templateName.trim()
      }

      const { data: existing } = await supabase
        .from('talent_bank_items')
        .select('id, metadata')
        .eq('user_id', session.user.id)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!existing) {
        alert('Portfolio not found')
        return
      }

      const meta = (existing.metadata || {}) as any
      const templateStates = meta.template_states || {}
      
      // Save to template_states as default (backward compatible)
      templateStates[templateId] = templateState

      // Also save family_community descriptions if they were edited
      if (Object.keys(localFamilyCommunityDescriptions).length > 0 || portfolioData.family_community?.descriptions) {
        meta.family_community = {
          ...(meta.family_community || {}),
          imageIds: portfolioData.family_community?.imageIds || [],
          descriptions: localFamilyCommunityDescriptions
        }
      }

      // Save bio if it was edited
      if (localBio !== portfolioData.bio) {
        meta.bio = localBio
      }

      // Update portfolio metadata
      const { error: portfolioError } = await supabase
        .from('talent_bank_items')
        .update({ metadata: { ...meta, template_states: templateStates } })
        .eq('id', existing.id)

      if (portfolioError) throw portfolioError

      // If saving as named template, also save to saved_templates table
      if (saveAsNamed && templateName) {
        const { error: savedTemplateError } = await supabase
          .from('saved_templates')
          .upsert({
            user_id: session.user.id,
            template_id: templateId,
            name: templateName,
            template_state: templateState,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,template_id,name',
          })

        if (savedTemplateError) {
          console.error('Error saving named template:', savedTemplateError)
          // Don't fail the whole operation, just log the error
        }
      }

      setEditMode(false)
      alert(saveAsNamed && templateName ? `Template "${templateName}" saved successfully!` : 'Template saved successfully!')
    } catch (error: any) {
      console.error('Error saving template state:', error)
      alert('Failed to save template state')
    } finally {
      setSaving(false)
    }
  }

  function toggleSection(section: string) {
    if (!templateState) return
    const included = templateState.included_sections.includes(section)
    setTemplateState({
      ...templateState,
      included_sections: included
        ? templateState.included_sections.filter(s => s !== section)
        : [...templateState.included_sections, section],
    })
  }

  function toggleItem(section: 'skills' | 'experience' | 'education' | 'referees' | 'projects' | 'attachments' | 'family_community', index: number) {
    if (!templateState) return
    const selected = templateState.selected_items[section]
    const isSelected = selected.includes(index)
    setTemplateState({
      ...templateState,
      selected_items: {
        ...templateState.selected_items,
        [section]: isSelected
          ? selected.filter(i => i !== index)
          : [...selected, index],
      },
    })
  }

  function toggleAvatar() {
    if (!templateState) return
    setTemplateState({
      ...templateState,
      include_avatar: !templateState.include_avatar,
    })
  }

  function toggleBanner() {
    if (!templateState) return
    setTemplateState({
      ...templateState,
      include_banner: !templateState.include_banner,
    })
  }

  function toggleIntroVideo() {
    if (!templateState) return
    setTemplateState({
      ...templateState,
      include_intro_video: !templateState.include_intro_video,
    })
  }

  // Only show loading if template or state not initialized
  if (!template || !templateState) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Get visible items based on selection
  const visibleSkills = (portfolioData.skills || []).filter((_, i) => templateState.selected_items.skills.includes(i))
  const visibleExperience = (portfolioData.experience || []).filter((_, i) => templateState.selected_items.experience.includes(i))
  // Don't render if template not found
  if (!template) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
        <div className="text-white">Template not found</div>
      </div>
    )
  }

  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className={`min-h-screen bg-gradient-to-b ${colors.bg} text-white`}>
        {/* Header with template-specific styling */}
        <header className={`sticky top-0 z-40 backdrop-blur bg-gradient-to-r ${colors.primary} border-b border-white/20`}>
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="text-white/90 hover:text-white font-semibold"
                onClick={onClose}
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-white">{template.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              {onSelectDifferentTemplate && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-white"
                  onClick={onSelectDifferentTemplate}
                >
                  Choose Different Template
                </button>
              )}
              {editMode ? (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-semibold text-white"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-white/90 font-semibold"
                    onClick={saveTemplateState}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Template'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-white/90 font-semibold"
                  onClick={() => setEditMode(true)}
                >
                  Edit Template
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Template Content - Unique layout per template */}
        <TemplateLayoutRenderer
          template={template}
          portfolioData={{
            ...portfolioData,
            bio: localBio,
            family_community: {
              ...portfolioData.family_community,
              descriptions: localFamilyCommunityDescriptions
            }
          }}
          templateState={templateState}
          editMode={editMode}
          onToggleSection={toggleSection}
          onToggleItem={toggleItem}
          onToggleAvatar={toggleAvatar}
          onToggleBanner={toggleBanner}
          onToggleIntroVideo={toggleIntroVideo}
          onUpdateBio={(bio: string) => {
            setLocalBio(bio)
          }}
          onUpdateFamilyCommunityDescription={(imageId: number, description: string) => {
            setLocalFamilyCommunityDescriptions(prev => ({
              ...prev,
              [imageId]: description
            }))
          }}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
          introVideoUrl={introVideoUrl}
          attachmentUrls={attachmentUrls}
          attachmentItemUrls={attachmentItemUrls}
          familyCommunityUrls={familyCommunityUrls}
          tbItemCache={tbItemCache}
          expandedTextareas={expandedTextareas}
          onToggleTextarea={(key: string) => {
            setExpandedTextareas(prev => ({ ...prev, [key]: !prev[key] }))
          }}
        />
      </div>
    </div>
  )
}
