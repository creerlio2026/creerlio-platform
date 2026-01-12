/**
 * Full-Stack Developer Layout
 * 
 * Sidebar layout with tech/terminal theme
 * Left sidebar with profile info
 * Main content area on the right
 */

'use client'

import { TemplateViewPortfolioData, TemplateState } from '../TemplateView'
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

export default function FullStackDeveloperLayout({
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
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))
  const familyCommunityImageIds = portfolioData.family_community?.imageIds || []
  const visibleFamilyCommunity = familyCommunityImageIds.filter((_, i) => (templateState.selected_items.family_community || []).includes(i))

  return (
    <div className="min-h-screen bg-slate-900 text-green-400 font-mono flex">
      {/* Left Sidebar - Fixed/Sticky */}
      <aside className="w-80 bg-slate-950 border-r border-green-500/20 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          {editMode && (
            <div className="mb-4 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templateState.included_sections.includes('intro')}
                  onChange={() => onToggleSection('intro')}
                  className="w-4 h-4 rounded border-2 border-green-500/30"
                />
                <span className="text-xs text-green-400/80">Include Intro</span>
              </label>
              {avatarUrl && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.include_avatar}
                    onChange={onToggleAvatar}
                    className="w-4 h-4 rounded border-2 border-green-500/30"
                  />
                  <span className="text-xs text-green-400/80">Include Avatar</span>
                </label>
              )}
            </div>
          )}

          {/* Avatar */}
          {(editMode || templateState.included_sections.includes('intro')) && (
            <>
              {avatarUrl && templateState.include_avatar && (
                <div className="mb-6 flex justify-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-green-500/30 bg-slate-800">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Name & Title */}
              <div className="mb-6 text-center">
                <div className="text-green-500/60 text-xs mb-2">$ whoami</div>
                <h1 className="text-2xl font-bold text-green-400 mb-2">{portfolioData.name}</h1>
                <div className="text-green-500/80 text-sm">{portfolioData.title}</div>
                {portfolioData.yearsExperience && (
                  <div className="mt-2 text-green-500/70 text-xs">
                    {portfolioData.yearsExperience}+ Years Experience
                  </div>
                )}
              </div>

              {/* Bio */}
              {(editMode || portfolioData.bio) && (
                <div className="mb-6">
                  <div className="text-green-500/60 text-xs mb-2">$ cat about.txt</div>
                  {editMode ? (
                    <CollapsibleTextarea
                      value={portfolioData.bio || ''}
                      onChange={(e) => onUpdateBio?.(e.target.value)}
                      placeholder="Enter your bio..."
                      className="w-full p-3 rounded bg-slate-900 border border-green-500/20 text-green-400 placeholder:text-green-500/50 font-mono text-sm"
                      expandKey="bio"
                      expanded={!!expandedTextareas['bio']}
                      onToggle={onToggleTextarea || (() => {})}
                      defaultRows={5}
                    />
                  ) : (
                    portfolioData.bio && (
                      <p className="text-green-400/70 text-sm leading-relaxed whitespace-pre-wrap">
                        {portfolioData.bio}
                      </p>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* Skills in Sidebar */}
          {(editMode || (templateState.included_sections.includes('skills') && visibleSkills.length > 0)) && (
            <div className="mb-6">
              {editMode && (
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('skills')}
                    onChange={() => onToggleSection('skills')}
                    className="w-4 h-4 rounded border-2 border-green-500/30"
                  />
                  <span className="text-xs text-green-400/80">Include Skills</span>
                </label>
              )}
              <div className="text-green-500/60 text-xs mb-3">$ skills</div>
              <div className="flex flex-wrap gap-2">
                {(portfolioData.skills || []).map((skill, idx) => {
                  const isSelected = templateState.selected_items.skills.includes(idx)
                  if (!editMode && !isSelected) return null
                  return (
                    <div key={idx} className="relative">
                      <span className={`px-2 py-1 text-xs border border-green-500/30 ${
                        editMode && !isSelected
                          ? 'bg-slate-800 text-slate-600 line-through'
                          : 'bg-green-500/10 text-green-400'
                      }`}>
                        {skill}
                      </span>
                      {editMode && (
                        <label className="absolute -top-1 -right-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleItem('skills', idx)}
                            className="w-3 h-3 rounded border-2 border-green-500/30"
                          />
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Social Links in Sidebar */}
          {(editMode || (templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0)) && (
            <div className="mb-6">
              {editMode && (
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('social')}
                    onChange={() => onToggleSection('social')}
                    className="w-4 h-4 rounded border-2 border-green-500/30"
                  />
                  <span className="text-xs text-green-400/80">Include Social</span>
                </label>
              )}
              <div className="text-green-500/60 text-xs mb-3">$ connect</div>
              <div className="flex flex-col gap-2">
                {(portfolioData.socialLinks || []).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border border-green-500/30 bg-slate-800/50 text-green-400 hover:bg-green-500/10 transition-colors text-sm text-center"
                  >
                    {link.platform || link.label || 'Link'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Intro Video */}
          {introVideoUrl && templateState.include_intro_video && (
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateState.include_intro_video}
                      onChange={onToggleIntroVideo}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Intro Video</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-4">$ intro_video</div>
              <div className="max-w-4xl mx-auto">
                <video src={introVideoUrl} controls className="w-full rounded-lg border border-green-500/30" style={{ maxHeight: '600px' }}>
                  Your browser does not support the video tag.
                </video>
              </div>
            </section>
          )}

          {/* Experience */}
          {(editMode || (templateState.included_sections.includes('experience') && visibleExperience.length > 0)) && (
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={templateState.included_sections.includes('experience')}
                    onChange={() => onToggleSection('experience')}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Section</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-6">$ experience</div>
              <div className="space-y-4">
                {(portfolioData.experience || []).map((exp, idx) => {
                  const isSelected = templateState.selected_items.experience.includes(idx)
                  if (!editMode && !isSelected) return null
                  return (
                    <div key={idx} className={`relative border-l-4 border-green-500 pl-6 py-4 bg-slate-800/50 ${
                      editMode && !isSelected ? 'opacity-40' : ''
                    }`}>
                      {editMode && (
                        <label className="absolute top-2 right-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleItem('experience', idx)}
                            className="w-5 h-5 rounded border-2 border-green-500/30"
                          />
                        </label>
                      )}
                      <div className="text-green-400 font-bold">{exp.title || exp.role || 'Role'}</div>
                      <div className="text-green-500/70 mb-2">{exp.company || 'Company'}</div>
                      {exp.description && (
                        <div className="text-green-400/70 text-sm whitespace-pre-wrap">{exp.description}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Projects */}
          {(editMode || (templateState.included_sections.includes('projects') && visibleProjects.length > 0)) && (
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={templateState.included_sections.includes('projects')}
                    onChange={() => onToggleSection('projects')}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Section</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-6">$ projects</div>
              <div className="grid md:grid-cols-2 gap-4">
                {(portfolioData.projects || []).map((project, idx) => {
                  const isSelected = templateState.selected_items.projects.includes(idx)
                  if (!editMode && !isSelected) return null
                  return (
                    <div key={idx} className={`relative border border-green-500/30 bg-slate-800/50 p-4 ${
                      editMode && !isSelected ? 'opacity-40' : ''
                    }`}>
                      {editMode && (
                        <label className="absolute top-2 right-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleItem('projects', idx)}
                            className="w-5 h-5 rounded border-2 border-green-500/30"
                          />
                        </label>
                      )}
                      <div className="text-green-400 font-bold mb-2">{project.name || project.title || 'Project'}</div>
                      {project.description && (
                        <div className="text-green-400/70 text-sm whitespace-pre-wrap">{project.description}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Education */}
          {(editMode || (templateState.included_sections.includes('education') && visibleEducation.length > 0)) && (
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={templateState.included_sections.includes('education')}
                    onChange={() => onToggleSection('education')}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Section</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-6">$ education</div>
              <div className="space-y-4">
                {(portfolioData.education || []).map((edu, idx) => {
                  const isSelected = templateState.selected_items.education.includes(idx)
                  if (!editMode && !isSelected) return null
                  const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
                  return (
                    <div key={idx} className={`relative border-l-4 border-green-500 pl-6 py-4 bg-slate-800/50 ${
                      editMode && !isSelected ? 'opacity-40' : ''
                    }`}>
                      {editMode && (
                        <label className="absolute top-2 right-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleItem('education', idx)}
                            className="w-5 h-5 rounded border-2 border-green-500/30"
                          />
                        </label>
                      )}
                      <div className="text-green-400 font-bold">{edu?.degree || edu?.qualification || 'Degree'}</div>
                      <div className="text-green-500/70 mb-2">{edu?.institution || edu?.school || 'Institution'}{edu?.year && ` • ${edu.year}`}</div>
                      {edu?.notes && <div className="text-green-400/70 text-sm whitespace-pre-wrap mt-2">{edu.notes}</div>}
                      {attachmentIds.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-green-500/60 mb-2">Attached documents: <span className="text-green-400/80 font-semibold">{attachmentIds.length}</span></div>
                          <div className="space-y-2">
                            {attachmentIds.slice(0, 3).map((id: any) => {
                              const numId = typeof id === 'number' ? id : Number(id)
                              if (!Number.isFinite(numId) || numId <= 0) return null
                              const it = tbItemCache[numId]
                              const url = attachmentItemUrls[numId]
                              if (!it) return <div key={numId} className="text-xs text-green-500/50 p-2 bg-slate-800 rounded">Loading document {numId}…</div>
                              const content = (
                                <div className="flex items-center gap-3 p-2 bg-slate-800 rounded border border-green-500/20 hover:bg-slate-700 transition-colors">
                                  <div className="text-sm text-green-400/80">{it?.title || 'Document'}</div>
                                  <div className="text-xs text-green-500/60">{it?.item_type || ''}</div>
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
                            {attachmentIds.length > 3 && <div className="text-xs text-green-500/50">+{attachmentIds.length - 3} more…</div>}
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
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={templateState.included_sections.includes('referees')}
                    onChange={() => onToggleSection('referees')}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Section</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-6">$ referees</div>
              <div className="space-y-4">
                {(portfolioData.referees || []).map((ref, idx) => {
                  const isSelected = templateState.selected_items.referees.includes(idx)
                  if (!editMode && !isSelected) return null
                  const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
                  return (
                    <div key={idx} className={`relative border-l-4 border-green-500 pl-6 py-4 bg-slate-800/50 ${
                      editMode && !isSelected ? 'opacity-40' : ''
                    }`}>
                      {editMode && (
                        <label className="absolute top-2 right-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleItem('referees', idx)}
                            className="w-5 h-5 rounded border-2 border-green-500/30"
                          />
                        </label>
                      )}
                      <div className="text-green-400 font-bold">{ref?.name || 'Referee'}</div>
                      <div className="text-green-500/70 mb-2">{ref?.title && `${ref.title} • `}{ref?.company || ''}</div>
                      {(ref?.email || ref?.phone) && <div className="text-green-500/60 text-sm mb-2">{ref?.email && <div>Email: {ref.email}</div>}{ref?.phone && <div>Phone: {ref.phone}</div>}</div>}
                      {ref?.notes && <div className="text-green-400/70 text-sm whitespace-pre-wrap mt-2">{ref.notes}</div>}
                      {attachmentIds.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-green-500/60 mb-2">Attached documents: <span className="text-green-400/80 font-semibold">{attachmentIds.length}</span></div>
                          <div className="space-y-2">
                            {attachmentIds.slice(0, 3).map((id: any) => {
                              const numId = typeof id === 'number' ? id : Number(id)
                              if (!Number.isFinite(numId) || numId <= 0) return null
                              const it = tbItemCache[numId]
                              const url = attachmentItemUrls[numId]
                              if (!it) return <div key={numId} className="text-xs text-green-500/50 p-2 bg-slate-800 rounded">Loading document {numId}…</div>
                              const content = (
                                <div className="flex items-center gap-3 p-2 bg-slate-800 rounded border border-green-500/20 hover:bg-slate-700 transition-colors">
                                  <div className="text-sm text-green-400/80">{it?.title || 'Document'}</div>
                                  <div className="text-xs text-green-500/60">{it?.item_type || ''}</div>
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
                            {attachmentIds.length > 3 && <div className="text-xs text-green-500/50">+{attachmentIds.length - 3} more…</div>}
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
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={templateState.included_sections.includes('attachments')}
                    onChange={() => onToggleSection('attachments')}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Section</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-6">$ attachments</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(portfolioData.attachments || []).map((att, idx) => {
                  const isSelected = templateState.selected_items.attachments.includes(idx)
                  if (!editMode && !isSelected) return null
                  const url = attachmentUrls[idx]
                  return (
                    <div key={idx} className={`relative border border-green-500/30 bg-slate-800/50 p-4 ${
                      editMode && !isSelected ? 'opacity-40' : ''
                    }`}>
                      {editMode && (
                        <label className="absolute top-2 right-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleItem('attachments', idx)}
                            className="w-5 h-5 rounded border-2 border-green-500/30"
                          />
                        </label>
                      )}
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <div className="text-green-400 font-bold">{att?.title || 'Attachment'}</div>
                          <div className="text-xs text-green-500/60 mt-1">{att?.file_type || att?.item_type || ''}</div>
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Family & Community */}
          {(editMode || (templateState.included_sections.includes('family_community') && visibleFamilyCommunity.length > 0)) && (
            <section className="mb-12 relative">
              {editMode && (
                <div className="mb-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateState.included_sections.includes('family_community')}
                      onChange={() => onToggleSection('family_community')}
                      className="w-5 h-5 rounded border-2 border-green-500/30"
                    />
                    <span className="text-sm text-green-400/80">Include Section</span>
                  </label>
                </div>
              )}
              <div className="text-green-400 mb-6">$ family_community</div>
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
                        <div className="relative group aspect-square overflow-hidden rounded-lg mb-3 border border-green-500/30">
                          {editMode && (
                            <label className="absolute top-2 right-2 z-10 cursor-pointer bg-slate-900/80 px-2 py-1 rounded">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleItem('family_community', idx)}
                                className="w-5 h-5 rounded border-2 border-green-500/30"
                              />
                            </label>
                          )}
                          {url ? (
                            <img src={url} alt={description || item?.title || 'Family & Community'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                              <div className="text-green-400 text-sm">Loading...</div>
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
                          className="w-full p-3 bg-slate-800/50 border border-green-500/30 rounded-lg text-green-400 text-sm placeholder:text-green-500/40 resize-none focus:outline-none focus:border-green-500/50 font-mono"
                          rows={3}
                          style={{ minHeight: '80px' }}
                          disabled={!editMode || !onUpdateFamilyCommunityDescription}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-green-500/60 py-8">
                  <p>No family & community images added yet.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
