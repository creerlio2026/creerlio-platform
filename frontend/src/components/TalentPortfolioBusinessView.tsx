/**
 * Talent Portfolio Business View
 * 
 * Renders portfolio from immutable snapshot ONLY
 * No access to live talent data or unshared content
 * Deterministic and reproducible rendering
 */

'use client'

import { useEffect, useState } from 'react'
import { PortfolioSnapshot, getSnapshotById, getSnapshotForBusiness } from '@/lib/portfolioSnapshots'
import { getTemplateById } from './portfolioTemplates'
import { supabase } from '@/lib/supabase'

interface TalentPortfolioBusinessViewProps {
  snapshotId?: string
  talentProfileId?: string
  businessId?: string
}

export default function TalentPortfolioBusinessView({
  snapshotId,
  talentProfileId,
  businessId,
}: TalentPortfolioBusinessViewProps) {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadSnapshot() {
      try {
        setLoading(true)
        setError(null)

        let loadedSnapshot: PortfolioSnapshot | null = null

        if (snapshotId) {
          loadedSnapshot = await getSnapshotById(snapshotId)
        } else if (talentProfileId && businessId) {
          loadedSnapshot = await getSnapshotForBusiness(talentProfileId, businessId)
        } else if (talentProfileId) {
          // Fallback: get latest snapshot (not recommended for business view)
          const { data } = await supabase
            .from('talent_portfolio_snapshots')
            .select('*')
            .eq('talent_profile_id', talentProfileId)
            .order('snapshot_timestamp', { ascending: false })
            .limit(1)
            .maybeSingle()
          loadedSnapshot = data as PortfolioSnapshot | null
        }

        if (!loadedSnapshot) {
          setError('Portfolio snapshot not found')
          return
        }

        setSnapshot(loadedSnapshot)

        // Load media URLs from snapshot
        const payload = loadedSnapshot.shared_payload
        if (payload.media.avatar_path) {
          const { data } = await supabase.storage
            .from('talent-bank')
            .createSignedUrl(payload.media.avatar_path, 3600)
          if (data) setAvatarUrl(data.signedUrl)
        }

        if (payload.media.banner_path) {
          const { data } = await supabase.storage
            .from('talent-bank')
            .createSignedUrl(payload.media.banner_path, 3600)
          if (data) setBannerUrl(data.signedUrl)
        }

        if (payload.media.intro_video_id) {
          // Get video file path from talent_bank_items
          const { data: videoItem } = await supabase
            .from('talent_bank_items')
            .select('file_path')
            .eq('id', payload.media.intro_video_id)
            .maybeSingle()
          
          if (videoItem?.file_path) {
            const { data } = await supabase.storage
              .from('talent-bank')
              .createSignedUrl(videoItem.file_path, 3600)
            if (data) setIntroVideoUrl(data.signedUrl)
          }
        }
      } catch (err: any) {
        console.error('Error loading snapshot:', err)
        setError(err.message || 'Failed to load portfolio')
      } finally {
        setLoading(false)
      }
    }

    loadSnapshot()
  }, [snapshotId, talentProfileId, businessId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Portfolio Not Available</h2>
          <p className="text-gray-400">{error || 'No portfolio snapshot found'}</p>
        </div>
      </div>
    )
  }

  const template = getTemplateById(snapshot.template_id)
  const payload = snapshot.shared_payload

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Banner */}
      <div className="h-44 md:h-56 bg-slate-900 relative">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.25),transparent_45%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Avatar & Intro */}
            <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 -mt-20">
              <div className="flex items-end gap-5">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-xl shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl">
                      {(payload.sections.intro?.name || 'T').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {payload.sections.intro?.name || 'Talent Portfolio'}
                  </h1>
                  <p className="text-slate-300 mt-1">
                    {payload.sections.intro?.title || ''}
                  </p>
                </div>
              </div>
              {payload.sections.intro?.bio && (
                <div className="mt-6 text-slate-300 whitespace-pre-wrap">
                  {payload.sections.intro.bio}
                </div>
              )}
            </section>

            {/* Intro Video */}
            {introVideoUrl && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Introduction Video</h2>
                <div className="rounded-3xl overflow-hidden bg-slate-900/60 border border-white/10">
                  <video src={introVideoUrl} controls playsInline className="w-full" />
                </div>
              </section>
            )}

            {/* Skills */}
            {payload.sections.skills && payload.sections.skills.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {payload.sections.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {payload.sections.experience && payload.sections.experience.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Experience</h2>
                <div className="space-y-4">
                  {payload.sections.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="font-semibold">{exp.title || 'Role'}</div>
                      <div className="text-slate-300 text-sm mt-1">{exp.company || 'Company'}</div>
                      {exp.description && (
                        <div className="mt-3 text-slate-300 text-sm whitespace-pre-wrap">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {payload.sections.education && payload.sections.education.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Education</h2>
                <div className="space-y-4">
                  {payload.sections.education.map((edu: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="font-semibold">{edu.degree || 'Degree'}</div>
                      <div className="text-slate-300 text-sm mt-1">{edu.institution || 'Institution'}</div>
                      {edu.field && (
                        <div className="text-slate-400 text-sm mt-1">{edu.field}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {payload.sections.projects && payload.sections.projects.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Projects</h2>
                <div className="space-y-4">
                  {payload.sections.projects.map((project: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="font-semibold">{project.name || project.title || 'Project'}</div>
                      {project.description && (
                        <div className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">
                          {project.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Social Links */}
            {payload.sections.social && payload.sections.social.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Connect</h2>
                <div className="space-y-2">
                  {payload.sections.social.map((link: any, idx: number) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-sm transition-colors"
                    >
                      {link.platform || link.label || 'Link'}
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Template Info (for debugging - remove in production) */}
            {template && (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <div className="text-xs text-gray-500">
                  Template: {template.name}
                  <br />
                  Snapshot: {new Date(snapshot.snapshot_timestamp).toLocaleDateString()}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
