/**
 * Portfolio Share Configuration Component
 * 
 * Implements Layer 2: Share Configuration (Filter Layer)
 * Allows talent to control what sections and media are shared with businesses
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface ShareConfig {
  share_intro: boolean
  share_social: boolean
  share_skills: boolean
  share_experience: boolean
  share_education: boolean
  share_referees: boolean
  share_projects: boolean
  share_attachments: boolean
  share_avatar: boolean
  share_banner: boolean
  share_intro_video: boolean
  selected_avatar_path: string | null
  selected_banner_path: string | null
  selected_intro_video_id: number | null
}

interface PortfolioShareConfigProps {
  talentProfileId: string | null
  userId: string | null
  avatarPath: string | null
  bannerPath: string | null
  introVideoId: number | null
  onConfigChange?: (config: ShareConfig) => void
}

export default function PortfolioShareConfig({
  talentProfileId,
  userId,
  avatarPath,
  bannerPath,
  introVideoId,
  onConfigChange,
}: PortfolioShareConfigProps) {
  const [config, setConfig] = useState<ShareConfig>({
    share_intro: false,
    share_social: false,
    share_skills: false,
    share_experience: false,
    share_education: false,
    share_referees: false,
    share_projects: false,
    share_attachments: false,
    share_avatar: false,
    share_banner: false,
    share_intro_video: false,
    selected_avatar_path: null,
    selected_banner_path: null,
    selected_intro_video_id: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isSavingRef = useRef(false) // Track if a save is in progress to prevent load from overwriting

  // Load existing share config
  useEffect(() => {
    if (!talentProfileId || !userId) {
      setLoading(false)
      return
    }

    async function loadConfig() {
      // Don't load if a save is in progress (prevents overwriting optimistic updates)
      if (isSavingRef.current) {
        console.log('[ShareConfig] Skipping load - save in progress')
        setLoading(false)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('talent_portfolio_share_config')
          .select('*')
          .eq('talent_profile_id', talentProfileId)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading share config:', error)
        } else if (data) {
          // Only update if not currently saving
          if (!isSavingRef.current) {
            setConfig({
              share_intro: data.share_intro ?? false,
              share_social: data.share_social ?? false,
              share_skills: data.share_skills ?? false,
              share_experience: data.share_experience ?? false,
              share_education: data.share_education ?? false,
              share_referees: data.share_referees ?? false,
              share_projects: data.share_projects ?? false,
              share_attachments: data.share_attachments ?? false,
              share_avatar: data.share_avatar ?? false,
              share_banner: data.share_banner ?? false,
              share_intro_video: data.share_intro_video ?? false,
              selected_avatar_path: data.selected_avatar_path,
              selected_banner_path: data.selected_banner_path,
              selected_intro_video_id: data.selected_intro_video_id,
            })
          }
        }
      } catch (error) {
        console.error('Exception loading share config:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [talentProfileId, userId])

  // Update selected media paths when portfolio media changes
  useEffect(() => {
    if (avatarPath && config.share_avatar) {
      setConfig(prev => ({ ...prev, selected_avatar_path: avatarPath }))
    }
  }, [avatarPath, config.share_avatar])

  useEffect(() => {
    if (bannerPath && config.share_banner) {
      setConfig(prev => ({ ...prev, selected_banner_path: bannerPath }))
    }
  }, [bannerPath, config.share_banner])

  useEffect(() => {
    if (introVideoId && config.share_intro_video) {
      setConfig(prev => ({ ...prev, selected_intro_video_id: introVideoId }))
    }
  }, [introVideoId, config.share_intro_video])

  // Notify parent of config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config)
    }
  }, [config, onConfigChange])

  const updateConfig = async (updates: Partial<ShareConfig>) => {
    // Store previous state for potential revert
    const previousConfig = { ...config }
    
    // Update state immediately (optimistic update)
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)

    if (!talentProfileId || !userId) return

    // Mark that we're saving to prevent load from overwriting
    isSavingRef.current = true
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('talent_portfolio_share_config')
        .upsert({
          talent_profile_id: talentProfileId,
          user_id: userId,
          ...newConfig,
        }, {
          onConflict: 'talent_profile_id',
        })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error saving share config:', error)
      // Revert on error - revert only the fields that were changed in this update
      setConfig(prevState => {
        const reverted = { ...prevState }
        Object.keys(updates).forEach(key => {
          const updateKey = key as keyof ShareConfig
          // Revert to the value from previousConfig (the state before this update)
          reverted[updateKey] = previousConfig[updateKey]
        })
        return reverted
      })
    } finally {
      isSavingRef.current = false
      setSaving(false)
    }
  }

  const toggleSection = (section: keyof ShareConfig) => {
    if (section.startsWith('share_')) {
      updateConfig({ [section]: !config[section] })
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-900/50 rounded-lg border border-white/10">
        <div className="text-sm text-gray-400">Loading share settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🔒</span>
          Share Configuration
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Control what sections and media businesses can see. All content is saved regardless of sharing settings.
        </p>

        {/* Section Toggles */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Sections</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ToggleItem
              label="Introduction"
              checked={config.share_intro}
              onChange={() => toggleSection('share_intro')}
              disabled={saving}
            />
            <ToggleItem
              label="Social Links"
              checked={config.share_social}
              onChange={() => toggleSection('share_social')}
              disabled={saving}
            />
            <ToggleItem
              label="Skills"
              checked={config.share_skills}
              onChange={() => toggleSection('share_skills')}
              disabled={saving}
            />
            <ToggleItem
              label="Experience"
              checked={config.share_experience}
              onChange={() => toggleSection('share_experience')}
              disabled={saving}
            />
            <ToggleItem
              label="Education"
              checked={config.share_education}
              onChange={() => toggleSection('share_education')}
              disabled={saving}
            />
            <ToggleItem
              label="Referees"
              checked={config.share_referees}
              onChange={() => toggleSection('share_referees')}
              disabled={saving}
            />
            <ToggleItem
              label="Projects"
              checked={config.share_projects}
              onChange={() => toggleSection('share_projects')}
              disabled={saving}
            />
            <ToggleItem
              label="Attachments"
              checked={config.share_attachments}
              onChange={() => toggleSection('share_attachments')}
              disabled={saving}
            />
          </div>
        </div>

        {/* Media Toggles */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Media</h4>
          
          <div className="space-y-3">
            <ToggleItem
              label="Avatar"
              checked={config.share_avatar}
              onChange={() => {
                const newShareAvatar = !config.share_avatar
                updateConfig({
                  share_avatar: newShareAvatar,
                  selected_avatar_path: newShareAvatar && avatarPath ? avatarPath : null,
                })
              }}
              disabled={saving || !avatarPath}
              helperText={!avatarPath ? 'No avatar uploaded' : undefined}
            />
            <ToggleItem
              label="Banner"
              checked={config.share_banner}
              onChange={() => {
                const newShareBanner = !config.share_banner
                updateConfig({
                  share_banner: newShareBanner,
                  selected_banner_path: newShareBanner && bannerPath ? bannerPath : null,
                })
              }}
              disabled={saving || !bannerPath}
              helperText={!bannerPath ? 'No banner uploaded' : undefined}
            />
            <ToggleItem
              label="Intro Video"
              checked={config.share_intro_video}
              onChange={() => {
                const newShareVideo = !config.share_intro_video
                updateConfig({
                  share_intro_video: newShareVideo,
                  selected_intro_video_id: newShareVideo && introVideoId ? introVideoId : null,
                })
              }}
              disabled={saving || !introVideoId}
              helperText={!introVideoId ? 'No intro video uploaded' : undefined}
            />
          </div>
        </div>

        {saving && (
          <div className="mt-4 text-xs text-blue-400">Saving...</div>
        )}
      </div>
    </div>
  )
}

function ToggleItem({
  label,
  checked,
  onChange,
  disabled,
  helperText,
}: {
  label: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  helperText?: string
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/5">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-200 cursor-pointer" onClick={!disabled ? onChange : undefined}>
          {label}
        </label>
        {helperText && (
          <div className="text-xs text-gray-500 mt-1">{helperText}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
