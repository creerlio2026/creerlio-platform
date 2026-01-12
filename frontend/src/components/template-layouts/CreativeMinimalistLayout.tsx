/**
 * Creative Minimalist Layout
 * 
 * Clean, modern design with lots of white space
 * Minimal borders, subtle shadows
 * Focus on typography and content
 */

'use client'

import { TemplateViewPortfolioData, TemplateState } from '../TemplateView'
import { PDFThumbnail } from './pdfThumbnail'
import { CollapsibleTextarea } from '../CollapsibleTextarea'

interface LayoutProps {
  portfolioData: TemplateViewPortfolioData
  templateState: TemplateState
  editMode: boolean
  onToggleSection: (section: string) => void
  onToggleItem: (section: string, index: number) => void
  onToggleAvatar: () => void
  onToggleBanner: () => void
  onToggleIntroVideo: () => void
  onUpdateBio?: (bio: string) => void
  onUpdateFamilyCommunityDescription?: (imageId: number, description: string) => void
  avatarUrl: string | null
  bannerUrl: string | null
  introVideoUrl: string | null
  attachmentUrls: Record<number, string>
  attachmentItemUrls: Record<number, string>
  familyCommunityUrls: Record<number, string>
  tbItemCache: Record<number, any>
  expandedTextareas?: Record<string, boolean>
  onToggleTextarea?: (key: string) => void
}

export default function CreativeMinimalistLayout({
  portfolioData,
  templateState,
  editMode,
  onToggleSection,
  onToggleItem,
  onToggleAvatar,
  onToggleBanner,
  onToggleIntroVideo,
  onUpdateBio,
  onUpdateFamilyCommunityDescription,
  avatarUrl,
  bannerUrl,
  introVideoUrl,
  attachmentUrls,
  attachmentItemUrls,
  familyCommunityUrls,
  tbItemCache,
  expandedTextareas = {},
  onToggleTextarea,
}: LayoutProps) {
  const visibleSkills = (portfolioData.skills || []).filter((_, i) => templateState.selected_items.skills.includes(i))
  const visibleExperience = (portfolioData.experience || []).filter((_, i) => templateState.selected_items.experience.includes(i))
  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const familyCommunityImageIds = portfolioData.family_community?.imageIds || []
  const visibleFamilyCommunity = familyCommunityImageIds.filter((_, i) => (templateState.selected_items.family_community || []).includes(i))
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Minimalist Header - No banner, just clean space */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Avatar and Intro - Centered, minimal */}
        {(editMode || templateState.included_sections.includes('intro')) && (
          <section className="text-center mb-16 relative">
            {editMode && (
              <div className="absolute top-0 right-0 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('intro')}
                    onChange={() => onToggleSection('intro')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Intro</span>
                </label>
                {avatarUrl && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateState.include_avatar}
                      onChange={onToggleAvatar}
                      className="w-5 h-5 rounded border-2 border-slate-300"
                    />
                    <span className="text-sm text-slate-600">Include Avatar</span>
                  </label>
                )}
              </div>
            )}
            <div className="flex justify-center mb-6">
              {avatarUrl && templateState.include_avatar && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200 bg-purple-50">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              )}
              {(!avatarUrl || !templateState.include_avatar) && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200 bg-purple-50 flex items-center justify-center font-bold text-4xl text-purple-400">
                  {portfolioData.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-5xl font-light tracking-tight mb-3">{portfolioData.name}</h1>
            <p className="text-xl text-slate-600 font-light mb-6">{portfolioData.title}</p>
            {(editMode || portfolioData.bio) && (
              <>
                {editMode ? (
                  <CollapsibleTextarea
                    value={portfolioData.bio || ''}
                    onChange={(e) => onUpdateBio?.(e.target.value)}
                    placeholder="Enter your bio..."
                    className="w-full max-w-2xl mx-auto p-3 rounded bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-500"
                    expandKey="bio"
                    expanded={!!expandedTextareas['bio']}
                    onToggle={onToggleTextarea || (() => {})}
                    defaultRows={5}
                  />
                ) : (
                  portfolioData.bio && (
                    <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap">
                      {portfolioData.bio}
                    </p>
                  )
                )}
              </>
            )}
          </section>
        )}

        {/* Intro Video */}
        {introVideoUrl && templateState.include_intro_video && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.include_intro_video}
                    onChange={onToggleIntroVideo}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Intro Video</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-6 text-slate-800">Introduction Video</h2>
            <div className="max-w-4xl mx-auto">
              <video src={introVideoUrl} controls className="w-full rounded-lg border border-slate-200" style={{ maxHeight: '600px' }}>
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        )}
        {/* Skills - Minimal tags, subtle background */}
        {(editMode || (templateState.included_sections.includes('skills') && visibleSkills.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('skills')}
                    onChange={() => onToggleSection('skills')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-6 text-slate-800">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {(portfolioData.skills || []).map((skill, idx) => {
                const isSelected = templateState.selected_items.skills.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <div key={idx} className="relative">
                    <span className={`px-4 py-2 rounded-full text-sm font-light ${
                      editMode && !isSelected
                        ? 'bg-slate-100 text-slate-400 line-through'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {skill}
                    </span>
                    {editMode && (
                      <label className="absolute -top-1 -right-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('skills', idx)}
                          className="w-4 h-4 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Experience - Clean timeline, minimal borders */}
        {(editMode || (templateState.included_sections.includes('experience') && visibleExperience.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('experience')}
                    onChange={() => onToggleSection('experience')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-8 text-slate-800">Experience</h2>
            <div className="space-y-8">
              {(portfolioData.experience || []).map((exp, idx) => {
                const isSelected = templateState.selected_items.experience.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <div key={idx} className={`relative pb-8 border-l-2 border-purple-200 pl-8 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-0 right-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('experience', idx)}
                          className="w-5 h-5 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-400 border-2 border-white"></div>
                    <div className="font-light text-lg text-slate-900">{exp.title || exp.role || 'Role'}</div>
                    <div className="text-slate-600 mb-2">{exp.company || 'Company'}</div>
                    {exp.description && (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Projects - Grid layout, minimal cards */}
        {(editMode || (templateState.included_sections.includes('projects') && visibleProjects.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('projects')}
                    onChange={() => onToggleSection('projects')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-8 text-slate-800">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {(portfolioData.projects || []).map((project, idx) => {
                const isSelected = templateState.selected_items.projects.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <div key={idx} className={`relative p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('projects', idx)}
                          className="w-5 h-5 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                    <h3 className="text-xl font-light mb-2 text-slate-900">{project.name || project.title || 'Project'}</h3>
                    {project.description && (
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Education */}
        {(editMode || (templateState.included_sections.includes('education') && visibleEducation.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('education')}
                    onChange={() => onToggleSection('education')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-8 text-slate-800">Education</h2>
            <div className="space-y-8">
              {(portfolioData.education || []).map((edu, idx) => {
                const isSelected = templateState.selected_items.education.includes(idx)
                if (!editMode && !isSelected) return null
                const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
                return (
                  <div key={idx} className={`relative pb-8 border-l-2 border-purple-200 pl-8 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-0 right-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('education', idx)}
                          className="w-5 h-5 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-400 border-2 border-white"></div>
                    <div className="font-light text-lg text-slate-900">{edu?.degree || edu?.qualification || 'Degree'}</div>
                    <div className="text-slate-600 mb-2">{edu?.institution || edu?.school || 'Institution'}{edu?.year && ` • ${edu.year}`}</div>
                    {edu?.notes && <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mt-2">{edu.notes}</p>}
                    {attachmentIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div>
                        <div className="space-y-2">
                          {attachmentIds.slice(0, 3).map((id: any) => {
                            const numId = typeof id === 'number' ? id : Number(id)
                            if (!Number.isFinite(numId) || numId <= 0) return null
                            const it = tbItemCache[numId]
                            const url = attachmentItemUrls[numId]
                            if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>
                            const content = (
                              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
                                <div className="text-sm text-slate-700">{it?.title || 'Document'}</div>
                                <div className="text-xs text-slate-500">{it?.item_type || ''}</div>
                              </div>
                            )
                            return url ? (
                              <a key={numId} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                {content}
                              </a>
                            ) : (
                              <div key={numId}>{content}</div>
                            )
                          })}
                          {attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {/* Referees */}
        {(editMode || (templateState.included_sections.includes('referees') && visibleReferees.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('referees')}
                    onChange={() => onToggleSection('referees')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-8 text-slate-800">Referees</h2>
            <div className="space-y-8">
              {(portfolioData.referees || []).map((ref, idx) => {
                const isSelected = templateState.selected_items.referees.includes(idx)
                if (!editMode && !isSelected) return null
                const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
                return (
                  <div key={idx} className={`relative pb-8 border-l-2 border-purple-200 pl-8 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-0 right-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('referees', idx)}
                          className="w-5 h-5 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-400 border-2 border-white"></div>
                    <div className="font-light text-lg text-slate-900">{ref?.name || 'Referee'}</div>
                    <div className="text-slate-600 mb-2">{ref?.title && `${ref.title} • `}{ref?.company || ''}</div>
                    {(ref?.email || ref?.phone) && <div className="text-slate-500 text-sm mb-2">{ref?.email && <div>Email: {ref.email}</div>}{ref?.phone && <div>Phone: {ref.phone}</div>}</div>}
                    {ref?.notes && <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mt-2">{ref.notes}</p>}
                    {attachmentIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div>
                        <div className="space-y-2">
                          {attachmentIds.slice(0, 3).map((id: any) => {
                            const numId = typeof id === 'number' ? id : Number(id)
                            if (!Number.isFinite(numId) || numId <= 0) return null
                            const it = tbItemCache[numId]
                            const url = attachmentItemUrls[numId]
                            if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>
                            const content = (
                              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
                                <div className="text-sm text-slate-700">{it?.title || 'Document'}</div>
                                <div className="text-xs text-slate-500">{it?.item_type || ''}</div>
                              </div>
                            )
                            return url ? (
                              <a key={numId} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                {content}
                              </a>
                            ) : (
                              <div key={numId}>{content}</div>
                            )
                          })}
                          {attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {/* Attachments */}
        {(editMode || (templateState.included_sections.includes('attachments') && visibleAttachments.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('attachments')}
                    onChange={() => onToggleSection('attachments')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-8 text-slate-800">Attachments</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(portfolioData.attachments || []).map((att, idx) => {
                const isSelected = templateState.selected_items.attachments.includes(idx)
                if (!editMode && !isSelected) return null
                const url = attachmentUrls[idx]
                const item = att?.id ? tbItemCache[att.id] : att
                const fileType = item?.file_type || att?.file_type || ''
                const title = item?.title || att?.title || 'Attachment'
                const isImg = fileType.startsWith('image/')
                const isVid = fileType.startsWith('video/')
                const isPdf = fileType.includes('pdf') || title.toLowerCase().endsWith('.pdf')
                return (
                  <div key={idx} className={`relative border border-slate-200 rounded-lg hover:shadow-lg transition-shadow overflow-hidden ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 z-10 cursor-pointer bg-white rounded p-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('attachments', idx)}
                          className="w-4 h-4 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                        {isImg && (
                          <div className="w-full h-48 overflow-hidden bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {isVid && (
                          <div className="w-full h-48 overflow-hidden bg-black relative">
                            <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center text-white text-xl">▶</div>
                          </div>
                        )}
                        {!isImg && !isVid && isPdf && (
                          <PDFThumbnail url={url} className="rounded-t-lg" />
                        )}
                        {!isImg && !isVid && !isPdf && (
                          <div className="w-full h-48 bg-slate-50 flex items-center justify-center">
                            <div className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">
                              FILE
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-lg font-light mb-1 text-slate-900 truncate">{title}</h3>
                          <p className="text-xs text-slate-500">{fileType || att?.item_type || ''}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="p-4">
                        <div className="w-full h-48 bg-slate-50 flex items-center justify-center mb-4">
                          <div className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">
                            FILE
                          </div>
                        </div>
                        <h3 className="text-lg font-light mb-1 text-slate-900">{title}</h3>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {/* Social Links - Minimal, centered */}
        {(editMode || (templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0)) && (
          <section className="mb-16 text-center relative">
            {editMode && (
              <div className="mb-4 flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('social')}
                    onChange={() => onToggleSection('social')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-6 text-slate-800">Connect</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {(portfolioData.socialLinks || []).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 border border-slate-300 rounded-full text-slate-700 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  {link.platform || link.label || 'Link'}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Family & Community */}
        {(editMode || (templateState.included_sections.includes('family_community') && visibleFamilyCommunity.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-6 flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('family_community')}
                    onChange={() => onToggleSection('family_community')}
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-light mb-8 text-center text-slate-800">Family & Community</h2>
            {familyCommunityImageIds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familyCommunityImageIds.map((imageId, idx) => {
                  const isSelected = (templateState.selected_items.family_community || []).includes(idx)
                  if (!editMode && !isSelected) return null
                  const url = familyCommunityUrls[imageId]
                  const item = tbItemCache[imageId]
                  const description = portfolioData.family_community?.descriptions?.[imageId] || ''
                  return (
                    <div key={idx} className={`relative ${editMode && !isSelected ? 'opacity-40' : ''}`}>
                      <div className="relative group aspect-square overflow-hidden rounded-lg mb-3 border border-slate-200">
                        {editMode && (
                          <label className="absolute top-2 right-2 z-10 cursor-pointer bg-white/90 px-2 py-1 rounded shadow">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleItem('family_community', idx)}
                              className="w-5 h-5 rounded border-2 border-slate-300"
                            />
                          </label>
                        )}
                        {url ? (
                          <img src={url} alt={description || item?.title || 'Family & Community'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <div className="text-slate-400 text-sm">Loading...</div>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => {
                          if (onUpdateFamilyCommunityDescription) {
                            onUpdateFamilyCommunityDescription(imageId, e.target.value)
                          }
                        }}
                        placeholder="Add a description for this image..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 resize-none focus:outline-none focus:border-slate-400"
                        rows={3}
                        style={{ minHeight: '80px' }}
                        disabled={!editMode || !onUpdateFamilyCommunityDescription}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <p>No family & community images added yet.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
