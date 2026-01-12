/**
 * Content Writer Layout
 * 
 * Text-focused, reading-friendly design
 * Typography-first, article-style layout
 * Clean, readable format
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

export default function ContentWriterLayout({
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Article-style header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {(editMode || templateState.included_sections.includes('intro')) && (
            <section className="relative">
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
              <div className="flex items-center gap-4 mb-6">
                {avatarUrl && templateState.include_avatar && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200">
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h1 className="text-4xl font-serif mb-1">{portfolioData.name}</h1>
                  <p className="text-lg text-slate-600">{portfolioData.title}</p>
                </div>
              </div>
              {(editMode || portfolioData.bio) && (
                <div className="prose prose-lg max-w-none">
                  {editMode ? (
                    <CollapsibleTextarea
                      value={portfolioData.bio || ''}
                      onChange={(e) => onUpdateBio?.(e.target.value)}
                      placeholder="Enter your bio..."
                      className="w-full p-3 rounded bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-500"
                      expandKey="bio"
                      expanded={!!expandedTextareas['bio']}
                      onToggle={onToggleTextarea || (() => {})}
                      defaultRows={5}
                    />
                  ) : (
                    portfolioData.bio && (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{portfolioData.bio}</p>
                    )
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Main content - article style */}
      <div className="max-w-3xl mx-auto px-8 py-12">
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
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Intro Video</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-serif mb-4 text-slate-900">Introduction Video</h2>
            <div className="max-w-4xl mx-auto">
              <video src={introVideoUrl} controls className="w-full rounded-lg border border-slate-200" style={{ maxHeight: '600px' }}>
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        )}
        {/* Skills - Inline tags */}
        {(editMode || (templateState.included_sections.includes('skills') && visibleSkills.length > 0)) && (
          <section className="mb-12 relative">
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
            <h2 className="text-2xl font-serif mb-4 text-slate-900">Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {(portfolioData.skills || []).map((skill, idx) => {
                const isSelected = templateState.selected_items.skills.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <div key={idx} className="relative">
                    <span className={`px-3 py-1 text-sm ${
                      editMode && !isSelected
                        ? 'text-slate-400 line-through'
                        : 'text-slate-700 border-b-2 border-slate-300'
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

        {/* Experience - Article format */}
        {(editMode || (templateState.included_sections.includes('experience') && visibleExperience.length > 0)) && (
          <section className="mb-12 relative">
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
            <h2 className="text-2xl font-serif mb-6 text-slate-900">Writing Experience</h2>
            <div className="space-y-8">
              {(portfolioData.experience || []).map((exp, idx) => {
                const isSelected = templateState.selected_items.experience.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <article key={idx} className={`relative pb-8 border-b border-slate-200 last:border-0 ${
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
                    <h3 className="text-xl font-serif mb-1">{exp.title || exp.role || 'Role'}</h3>
                    <p className="text-slate-600 mb-3 italic">{exp.company || 'Company'}</p>
                    {exp.description && (
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Projects - Article-style showcase */}
        {(editMode || (templateState.included_sections.includes('projects') && visibleProjects.length > 0)) && (
          <section className="mb-12 relative">
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
            <h2 className="text-2xl font-serif mb-6 text-slate-900">Published Work</h2>
            <div className="space-y-6">
              {(portfolioData.projects || []).map((project, idx) => {
                const isSelected = templateState.selected_items.projects.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <article key={idx} className={`relative p-6 bg-white rounded-lg shadow-sm ${
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
                    <h3 className="text-xl font-serif mb-2">{project.name || project.title || 'Project'}</h3>
                    {project.description && (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                    )}
                  </article>
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
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-serif mb-6 text-slate-900">Education</h2>
            <div className="space-y-8">
              {(portfolioData.education || []).map((edu, idx) => {
                const isSelected = templateState.selected_items.education.includes(idx)
                if (!editMode && !isSelected) return null
                const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
                return (
                  <article key={idx} className={`relative pb-8 border-b border-slate-200 last:border-0 ${
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
                    <h3 className="text-xl font-serif mb-1">{edu?.degree || edu?.qualification || 'Degree'}</h3>
                    <p className="text-slate-600 mb-3 italic">{edu?.institution || edu?.school || 'Institution'}{edu?.year && ` • ${edu.year}`}</p>
                    {edu?.notes && <div className="prose prose-slate max-w-none"><p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{edu.notes}</p></div>}
                    {attachmentIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div>
                        <div className="space-y-2">
                          {attachmentIds.slice(0, 3).map((id: any) => {
                            const numId = typeof id === 'number' ? id : Number(id)
                            if (!Number.isFinite(numId) || numId <= 0) return null
                            const it = tbItemCache[numId]
                            if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>
                            return <div key={numId} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                              <div className="text-sm text-slate-700">{it?.title || 'Document'}</div>
                              <div className="text-xs text-slate-500">{it?.item_type || ''}</div>
                            </div>
                          })}
                          {attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}
                        </div>
                      </div>
                    )}
                  </article>
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
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-serif mb-6 text-slate-900">Referees</h2>
            <div className="space-y-8">
              {(portfolioData.referees || []).map((ref, idx) => {
                const isSelected = templateState.selected_items.referees.includes(idx)
                if (!editMode && !isSelected) return null
                const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
                return (
                  <article key={idx} className={`relative pb-8 border-b border-slate-200 last:border-0 ${
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
                    <h3 className="text-xl font-serif mb-1">{ref?.name || 'Referee'}</h3>
                    <p className="text-slate-600 mb-3 italic">{ref?.title && `${ref.title} • `}{ref?.company || ''}</p>
                    {(ref?.email || ref?.phone) && <div className="text-slate-500 text-sm mb-3">{ref?.email && <div>Email: {ref.email}</div>}{ref?.phone && <div>Phone: {ref.phone}</div>}</div>}
                    {ref?.notes && <div className="prose prose-slate max-w-none"><p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{ref.notes}</p></div>}
                    {attachmentIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div>
                        <div className="space-y-2">
                          {attachmentIds.slice(0, 3).map((id: any) => {
                            const numId = typeof id === 'number' ? id : Number(id)
                            if (!Number.isFinite(numId) || numId <= 0) return null
                            const it = tbItemCache[numId]
                            if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>
                            return <div key={numId} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-200">
                              <div className="text-sm text-slate-700">{it?.title || 'Document'}</div>
                              <div className="text-xs text-slate-500">{it?.item_type || ''}</div>
                            </div>
                          })}
                          {attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}
                        </div>
                      </div>
                    )}
                  </article>
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
                    className="w-5 h-5 rounded border-2 border-slate-300"
                  />
                  <span className="text-sm text-slate-600">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-serif mb-6 text-slate-900">Attachments</h2>
            <div className="space-y-6">
              {(portfolioData.attachments || []).map((att, idx) => {
                const isSelected = templateState.selected_items.attachments.includes(idx)
                if (!editMode && !isSelected) return null
                const url = attachmentUrls[idx]
                return (
                  <article key={idx} className={`relative p-6 bg-white rounded-lg shadow-sm ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('attachments', idx)}
                          className="w-5 h-5 rounded border-2 border-slate-300"
                        />
                      </label>
                    )}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                        <h3 className="text-xl font-serif mb-2">{att?.title || 'Attachment'}</h3>
                        <p className="text-sm text-slate-500">{att?.file_type || att?.item_type || ''}</p>
                      </a>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}
        {/* Social - Minimal footer */}
        {(editMode || (templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0)) && (
          <section className="text-center relative">
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
            <div className="flex flex-wrap justify-center gap-4 pt-8 border-t border-slate-200">
              {(portfolioData.socialLinks || []).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  {link.platform || link.label || 'Link'}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Family & Community */}
        {(editMode || (templateState.included_sections.includes('family_community') && visibleFamilyCommunity.length > 0)) && (
          <section className="max-w-3xl mx-auto px-8 py-12 relative">
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
            <h2 className="text-3xl font-bold mb-8 text-center">Family & Community</h2>
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
