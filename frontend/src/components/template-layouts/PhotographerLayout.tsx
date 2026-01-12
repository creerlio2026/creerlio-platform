/**
 * Photography Portfolio Layout
 * 
 * Image-focused design with large image galleries
 * Minimal text, maximum visual impact
 * Grid-based project showcase
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

export default function PhotographerLayout({
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
  const visibleExperience = (portfolioData.experience || []).filter((_, i) => templateState.selected_items.experience.includes(i))
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))
  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))
  const visibleSkills = (portfolioData.skills || []).filter((_, i) => templateState.selected_items.skills.includes(i))
  const familyCommunityImageIds = portfolioData.family_community?.imageIds || []
  const visibleFamilyCommunity = familyCommunityImageIds.filter((_, i) => (templateState.selected_items.family_community || []).includes(i))

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full-width banner image */}
      {bannerUrl && templateState.include_banner && (
        <div className="h-[60vh] relative">
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}
      {(!bannerUrl || !templateState.include_banner) && (
        <div className="h-[60vh] relative bg-gradient-to-br from-purple-900 via-pink-900 to-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}
      
      {/* Overlay content */}
      {(editMode || templateState.included_sections.includes('intro')) && (
        <div className={`absolute ${bannerUrl && templateState.include_banner ? 'bottom-0' : 'top-0'} left-0 right-0 p-12`}>
          {editMode && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded">
                <input
                  type="checkbox"
                  checked={templateState.included_sections.includes('intro')}
                  onChange={() => onToggleSection('intro')}
                  className="w-5 h-5 rounded border-2 border-white/30"
                />
                <span className="text-sm text-white">Include Intro</span>
              </label>
              {bannerUrl && (
                <label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={templateState.include_banner}
                    onChange={onToggleBanner}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white">Include Banner</span>
                </label>
              )}
              {avatarUrl && (
                <label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={templateState.include_avatar}
                    onChange={onToggleAvatar}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white">Include Avatar</span>
                </label>
              )}
            </div>
          )}
          <div className="flex items-end gap-6">
            {avatarUrl && templateState.include_avatar && (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">{portfolioData.name}</h1>
              <p className="text-xl text-white/80">{portfolioData.title}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Bio - Minimal text */}
        {(editMode || portfolioData.bio) && (
          <section className="mb-12 text-center max-w-3xl mx-auto">
            {editMode ? (
              <div>
                <CollapsibleTextarea
                  value={portfolioData.bio || ''}
                  onChange={(e) => onUpdateBio?.(e.target.value)}
                  placeholder="Enter your bio..."
                  className="w-full p-3 rounded bg-white/5 border border-white/20 text-white placeholder:text-white/50"
                  expandKey="bio"
                  expanded={!!expandedTextareas['bio']}
                  onToggle={onToggleTextarea || (() => {})}
                  defaultRows={5}
                />
              </div>
            ) : (
              portfolioData.bio && (
                <p className="text-lg text-white/80 leading-relaxed whitespace-pre-wrap">{portfolioData.bio}</p>
              )
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
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Intro Video</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8 text-center">Introduction Video</h2>
            <div className="max-w-4xl mx-auto">
              <video
                src={introVideoUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: '600px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        )}

        {/* Skills */}
        {(editMode || (templateState.included_sections.includes('skills') && visibleSkills.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('skills')}
                    onChange={() => onToggleSection('skills')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8 text-center">Skills</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {(portfolioData.skills || []).map((skill, idx) => {
                const isSelected = templateState.selected_items.skills.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <span
                    key={idx}
                    className={`px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 text-white ${
                      editMode && !isSelected ? 'opacity-40' : ''
                    }`}
                  >
                    {editMode && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('skills', idx)}
                          className="w-4 h-4 rounded border-2 border-white/30 mr-2"
                        />
                        {skill}
                      </label>
                    )}
                    {!editMode && skill}
                  </span>
                )
              })}
            </div>
          </section>
        )}

        {/* Projects - Large image grid */}
        {(editMode || (templateState.included_sections.includes('projects') && visibleProjects.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('projects')}
                    onChange={() => onToggleSection('projects')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8 text-center">Portfolio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(portfolioData.projects || []).map((project, idx) => {
                const isSelected = templateState.selected_items.projects.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <div key={idx} className={`relative group aspect-square overflow-hidden rounded-lg ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 z-10 cursor-pointer bg-black/50 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('projects', idx)}
                          className="w-5 h-5 rounded border-2 border-white/30"
                        />
                      </label>
                    )}
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <div className="text-center p-6">
                        <h3 className="text-xl font-bold mb-2">{project.name || project.title || 'Project'}</h3>
                        {project.description && (
                          <p className="text-white/90 text-sm">{project.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Experience - Minimal, image-focused */}
        {(editMode || (templateState.included_sections.includes('experience') && visibleExperience.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('experience')}
                    onChange={() => onToggleSection('experience')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8">Experience</h2>
            <div className="space-y-6">
              {(portfolioData.experience || []).map((exp, idx) => {
                const isSelected = templateState.selected_items.experience.includes(idx)
                if (!editMode && !isSelected) return null
                return (
                  <div key={idx} className={`relative border-l-4 border-pink-500 pl-6 py-4 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('experience', idx)}
                          className="w-5 h-5 rounded border-2 border-white/30"
                        />
                      </label>
                    )}
                    <div className="text-xl font-bold">{exp.title || exp.role || 'Role'}</div>
                    <div className="text-white/70 mb-2">{exp.company || 'Company'}</div>
                    {exp.description && (
                      <p className="text-white/80 whitespace-pre-wrap">{exp.description}</p>
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
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('education')}
                    onChange={() => onToggleSection('education')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8">Education</h2>
            <div className="space-y-6">
              {(portfolioData.education || []).map((edu, idx) => {
                const isSelected = templateState.selected_items.education.includes(idx)
                if (!editMode && !isSelected) return null
                const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
                return (
                  <div key={idx} className={`relative border-l-4 border-pink-500 pl-6 py-4 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('education', idx)}
                          className="w-5 h-5 rounded border-2 border-white/30"
                        />
                      </label>
                    )}
                    <div className="text-xl font-bold">{edu?.degree || edu?.qualification || 'Degree'}</div>
                    <div className="text-white/70 mb-2">{edu?.institution || edu?.school || 'Institution'}</div>
                    {edu?.year && <div className="text-white/60 text-sm mb-2">{edu.year}</div>}
                    {edu?.notes && (
                      <p className="text-white/80 whitespace-pre-wrap mt-2">{edu.notes}</p>
                    )}
                    {attachmentIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-white/60 mb-2">
                          Attached documents: <span className="text-white/80 font-semibold">{attachmentIds.length}</span>
                        </div>
                        <div className="space-y-2">
                          {attachmentIds.slice(0, 3).map((id: any) => {
                            const numId = typeof id === 'number' ? id : Number(id)
                            if (!Number.isFinite(numId) || numId <= 0) return null
                            const it = tbItemCache[numId]
                            const url = attachmentItemUrls[numId]
                            if (!it) {
                              return (
                                <div key={numId} className="text-xs text-white/60 p-2 bg-white/5 rounded">
                                  Loading document {numId}…
                                </div>
                              )
                            }
                            const content = (
                              <div className="flex items-center gap-3 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                                <div className="text-sm text-white/80">{it?.title || 'Document'}</div>
                                <div className="text-xs text-white/60">{it?.item_type || ''}</div>
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
                          {attachmentIds.length > 3 && (
                            <div className="text-xs text-white/60">+{attachmentIds.length - 3} more…</div>
                          )}
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
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('referees')}
                    onChange={() => onToggleSection('referees')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8">Referees</h2>
            <div className="space-y-6">
              {(portfolioData.referees || []).map((ref, idx) => {
                const isSelected = templateState.selected_items.referees.includes(idx)
                if (!editMode && !isSelected) return null
                const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
                return (
                  <div key={idx} className={`relative border-l-4 border-pink-500 pl-6 py-4 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('referees', idx)}
                          className="w-5 h-5 rounded border-2 border-white/30"
                        />
                      </label>
                    )}
                    <div className="text-xl font-bold">{ref?.name || 'Referee'}</div>
                    <div className="text-white/70 mb-2">
                      {ref?.title && `${ref.title} • `}
                      {ref?.company || ''}
                    </div>
                    {(ref?.email || ref?.phone) && (
                      <div className="text-white/60 text-sm mb-2">
                        {ref?.email && <div>Email: {ref.email}</div>}
                        {ref?.phone && <div>Phone: {ref.phone}</div>}
                      </div>
                    )}
                    {ref?.notes && (
                      <p className="text-white/80 whitespace-pre-wrap mt-2">{ref.notes}</p>
                    )}
                    {attachmentIds.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-white/60 mb-2">
                          Attached documents: <span className="text-white/80 font-semibold">{attachmentIds.length}</span>
                        </div>
                        <div className="space-y-2">
                          {attachmentIds.slice(0, 3).map((id: any) => {
                            const numId = typeof id === 'number' ? id : Number(id)
                            if (!Number.isFinite(numId) || numId <= 0) return null
                            const it = tbItemCache[numId]
                            const url = attachmentItemUrls[numId]
                            if (!it) {
                              return (
                                <div key={numId} className="text-xs text-white/60 p-2 bg-white/5 rounded">
                                  Loading document {numId}…
                                </div>
                              )
                            }
                            const content = (
                              <div className="flex items-center gap-3 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                                <div className="text-sm text-white/80">{it?.title || 'Document'}</div>
                                <div className="text-xs text-white/60">{it?.item_type || ''}</div>
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
                          {attachmentIds.length > 3 && (
                            <div className="text-xs text-white/60">+{attachmentIds.length - 3} more…</div>
                          )}
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
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('attachments')}
                    onChange={() => onToggleSection('attachments')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-8">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(portfolioData.attachments || []).map((att, idx) => {
                const isSelected = templateState.selected_items.attachments.includes(idx)
                if (!editMode && !isSelected) return null
                const url = attachmentUrls[idx]
                return (
                  <div key={idx} className={`relative rounded-lg overflow-hidden border border-white/20 ${
                    editMode && !isSelected ? 'opacity-40' : ''
                  }`}>
                    {editMode && (
                      <label className="absolute top-2 right-2 z-10 cursor-pointer bg-black/50 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleItem('attachments', idx)}
                          className="w-4 h-4 rounded border-2 border-white/30"
                        />
                      </label>
                    )}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="text-sm font-semibold text-white">{att?.title || 'Attachment'}</div>
                        <div className="text-xs text-white/60 mt-1">{att?.file_type || att?.item_type || ''}</div>
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Family & Community - Image gallery */}
        {(editMode || (templateState.included_sections.includes('family_community') && familyCommunityImageIds.length > 0)) && (
          <section className="mb-16 relative">
            {editMode && (
              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('family_community')}
                    onChange={() => onToggleSection('family_community')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
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
                      <div className="relative group aspect-square overflow-hidden rounded-lg mb-3">
                        {editMode && (
                          <label className="absolute top-2 right-2 z-10 cursor-pointer bg-black/50 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleItem('family_community', idx)}
                              className="w-5 h-5 rounded border-2 border-white/30"
                            />
                          </label>
                        )}
                        {url ? (
                          <img src={url} alt={description || item?.title || 'Family & Community'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <div className="text-white text-sm">Loading...</div>
                          </div>
                        )}
                      </div>
                      {/* Description text box */}
                      <textarea
                        value={description}
                        onChange={(e) => {
                          if (onUpdateFamilyCommunityDescription) {
                            onUpdateFamilyCommunityDescription(imageId, e.target.value)
                          }
                        }}
                        placeholder="Add a description for this image..."
                        className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/40 resize-none focus:outline-none focus:border-pink-500/50"
                        rows={3}
                        style={{ minHeight: '80px' }}
                        disabled={!editMode || !onUpdateFamilyCommunityDescription}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-white/60 py-8">
                <p>No family & community images added yet.</p>
              </div>
            )}
          </section>
        )}

        {/* Social - Minimal, bottom of page */}
        {(editMode || (templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0)) && (
          <section className="text-center relative">
            {editMode && (
              <div className="mb-4 flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.included_sections.includes('social')}
                    onChange={() => onToggleSection('social')}
                    className="w-5 h-5 rounded border-2 border-white/30"
                  />
                  <span className="text-sm text-white/80">Include Section</span>
                </label>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-6">Connect</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {(portfolioData.socialLinks || []).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {link.platform || link.label || 'Link'}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
