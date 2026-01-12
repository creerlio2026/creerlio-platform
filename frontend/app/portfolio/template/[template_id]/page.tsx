'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import TemplateView from '@/components/TemplateView'
import { supabase } from '@/lib/supabase'
import { TemplateId } from '@/components/portfolioTemplates'

interface PortfolioData {
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

export default function TemplatePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const templateId = params.template_id as TemplateId
  const savedTemplateId = searchParams.get('load')
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [savedTemplateState, setSavedTemplateState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolioData()
    if (savedTemplateId) {
      loadSavedTemplate()
    }
  }, [savedTemplateId])

  const loadPortfolioData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        router.push('/login/talent')
        return
      }

      const { data: portfolioItems, error } = await supabase
        .from('talent_bank_items')
        .select('metadata')
        .eq('user_id', session.user.id)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !portfolioItems) {
        router.push('/portfolio')
        return
      }

      const meta = portfolioItems.metadata || {}
      
      // Process data exactly like /portfolio/view does
      function normalizeDisplayText(s: string) {
        return String(s || '')
          .replace(/\r/g, '\n')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      }
      
      // Process experience with attachmentIds (same as view page)
      const experience = Array.isArray(meta.experience)
        ? meta.experience.map((e: any) => {
            const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
              const num = Number(id)
              return Number.isFinite(num) && num > 0
            }).map((id: any) => Number(id)) : []
            
            return {
              ...e,
              attachmentIds: attachmentIds,
            }
          }).filter((e: any) => {
            const title = String(e?.role || e?.title || '').trim()
            const company = String(e?.company || e?.organisation || '').trim()
            const desc = normalizeDisplayText(String(e?.description || ''))
            const hasAttachments = Array.isArray(e.attachmentIds) && e.attachmentIds.length > 0
            return !!(title || company || desc || hasAttachments)
          })
        : []
      
      // Process education with attachmentIds (same as view page)
      const education = Array.isArray(meta.education)
        ? meta.education.map((e: any) => {
            let attachmentIds: number[] = []
            if (Array.isArray(e?.attachmentIds)) {
              attachmentIds = e.attachmentIds.filter((id: any) => {
                const num = Number(id)
                return Number.isFinite(num) && num > 0
              }).map((id: any) => Number(id))
            } else if (e?.attachmentIds != null) {
              const num = Number(e.attachmentIds)
              if (Number.isFinite(num) && num > 0) {
                attachmentIds = [num]
              }
            }
            
            const inst = String(e?.institution || e?.school || '').trim()
            const degree = String(e?.qualification || e?.degree || '').trim()
            const notes = normalizeDisplayText(String(e?.notes || ''))
            const year = String(e?.year || e?.endYear || '').trim()
            
            return {
              ...e,
              institution: inst,
              degree: degree,
              qualification: degree,
              school: inst,
              notes: notes,
              year: year,
              endYear: year,
              attachmentIds: attachmentIds,
            }
          }).filter((e: any) => {
            const hasContent = !!(e.institution || e.degree || e.notes || e.year)
            const hasAttachments = Array.isArray(e.attachmentIds) && e.attachmentIds.length > 0
            return hasContent || hasAttachments
          })
        : []
      
      // Process referees with attachmentIds (same as view page)
      const referees = Array.isArray(meta.referees)
        ? meta.referees.map((r: any) => ({
            name: String(r?.name || '').trim(),
            relationship: String(r?.relationship || '').trim(),
            company: String(r?.company || '').trim(),
            title: String(r?.title || '').trim(),
            email: String(r?.email || '').trim(),
            phone: String(r?.phone || '').trim(),
            notes: normalizeDisplayText(String(r?.notes || '')),
            attachmentIds: Array.isArray(r?.attachmentIds) ? r.attachmentIds : [],
          })).filter((r: any) => {
            return !!(r.name || r.notes || r.email || r.phone || r.title || r.company || r.relationship)
          })
        : []
      
      // Process projects with attachmentIds (same as view page)
      const projects = Array.isArray(meta.projects)
        ? meta.projects.map((p: any) => ({
            name: String(p?.name || '').trim(),
            url: String(p?.url || '').trim(),
            description: normalizeDisplayText(String(p?.description || '')),
            attachmentIds: Array.isArray(p?.attachmentIds) ? p.attachmentIds : [],
          })).filter((p: any) => {
            return !!(p.name || p.url || p.description || (p.attachmentIds && p.attachmentIds.length > 0))
          })
        : []
      
      // Process socialLinks (same as view page)
      const socialLinks: Array<{ platform: string; url: string }> = []
      const raw = Array.isArray(meta.socialLinks) ? meta.socialLinks : []
      for (const it of raw) {
        const platform = String((it as any)?.platform ?? '').trim()
        const url = String((it as any)?.url ?? '').trim()
        if (!platform || !url) continue
        socialLinks.push({ platform, url })
      }
      
      // Back-compat: single fields
      const legacy: Array<[string, string | null | undefined]> = [
        ['LinkedIn', meta.linkedin || meta.linkedIn || meta?.social?.linkedin || meta?.socials?.linkedin || null],
        ['GitHub', meta.github || meta?.social?.github || null],
        ['YouTube', meta.youtube || meta?.social?.youtube || null],
        ['Website', meta.website || meta?.site || null],
        ['X', meta.twitter || meta.x || null],
        ['Instagram', meta.instagram || null],
        ['Facebook', meta.facebook || null],
        ['TikTok', meta.tiktok || null],
        ['Behance', meta.behance || null],
        ['Dribbble', meta.dribbble || null],
      ]
      for (const [platform, url0] of legacy) {
        const url = String(url0 || '').trim()
        if (!url) continue
        if (socialLinks.some((x) => String(x.platform).toLowerCase() === platform.toLowerCase())) continue
        socialLinks.push({ platform, url })
      }
      
      // Dedupe by platform+url
      const seen = new Set<string>()
      const finalSocialLinks: Array<{ platform: string; url: string }> = []
      for (const it of socialLinks) {
        const key = `${String(it.platform).toLowerCase()}|${String(it.url).toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        finalSocialLinks.push(it)
      }
      
      const portfolio: PortfolioData = {
        name: meta.name || session.user.user_metadata?.full_name || 'Your Name',
        title: meta.title || 'Your Professional Title',
        bio: normalizeDisplayText(meta.bio || ''),
        avatar_path: meta.avatar_path || null,
        banner_path: meta.banner_path || null,
        introVideoId: meta.introVideoId || null,
        socialLinks: finalSocialLinks,
        skills: Array.isArray(meta.skills) ? meta.skills.map((s: any) => String(s || '').trim()).filter(Boolean) : [],
        experience,
        education,
        referees,
        projects,
        attachments: Array.isArray(meta.attachments) ? meta.attachments : [],
        family_community: meta.family_community && typeof meta.family_community === 'object' && meta.family_community !== null
          ? {
              imageIds: Array.isArray(meta.family_community.imageIds) ? meta.family_community.imageIds : [],
              descriptions: typeof meta.family_community.descriptions === 'object' && meta.family_community.descriptions !== null
                ? meta.family_community.descriptions
                : {}
            }
          : { imageIds: [], descriptions: {} },
        sectionOrder: Array.isArray(meta.sectionOrder) ? meta.sectionOrder : ['intro', 'social', 'skills', 'experience', 'education', 'referees', 'projects', 'attachments'],
      }

      setPortfolioData(portfolio)
    } catch (error) {
      console.error('Error loading portfolio:', error)
      router.push('/portfolio')
    } finally {
      setLoading(false)
    }
  }

  const loadSavedTemplate = async () => {
    if (!savedTemplateId) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return

      const { data, error } = await supabase
        .from('saved_templates')
        .select('template_state')
        .eq('id', savedTemplateId)
        .eq('user_id', session.user.id)
        .eq('template_id', templateId)
        .maybeSingle()

      if (error) throw error
      if (data?.template_state) {
        setSavedTemplateState(data.template_state)
      }
    } catch (error) {
      console.error('Error loading saved template:', error)
    }
  }

  if (loading || !portfolioData) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
        <div className="text-white">Loading template...</div>
      </div>
    )
  }

  return (
    <TemplateView
      templateId={templateId}
      portfolioData={portfolioData}
      initialTemplateState={savedTemplateState}
      onClose={() => router.push('/portfolio')}
      onSelectDifferentTemplate={() => router.push('/portfolio/templates')}
    />
  )
}
