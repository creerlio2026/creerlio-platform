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
  avatarUrl: string | null
  bannerUrl: string | null
  introVideoUrl: string | null
  attachmentUrls: Record<number, string>
  tbItemCache: Record<number, any>
  expandedTextareas?: Record<string, boolean>
  onToggleTextarea?: (key: string) => void
}
export default function SalesProfessionalLayout(props: LayoutProps) {
  const { portfolioData, templateState, editMode, onToggleSection, onToggleItem, onToggleAvatar, onToggleBanner, onToggleIntroVideo,
  onUpdateBio, avatarUrl, bannerUrl, introVideoUrl, attachmentUrls, tbItemCache, expandedTextareas = {}, onToggleTextarea } = props
  const visibleSkills = (portfolioData.skills || []).filter((_, i) => templateState.selected_items.skills.includes(i))
  const visibleExperience = (portfolioData.experience || []).filter((_, i) => templateState.selected_items.experience.includes(i))
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Full-Width Hero Section - Landing Page Style */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-orange-600 via-yellow-500 to-orange-700 text-white overflow-hidden">
        {bannerUrl && templateState.include_banner && (
          <div className="absolute inset-0 z-0">
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 via-yellow-500/90 to-orange-700/90"></div>
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-8 py-20 text-center w-full">
          {editMode && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                <input type="checkbox" checked={templateState.included_sections.includes('intro')} onChange={() => onToggleSection('intro')} className="w-5 h-5 rounded border-2 border-white/30" />
                <span className="text-sm text-white">Include Intro</span>
              </label>
              {avatarUrl && (
                <label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                  <input type="checkbox" checked={templateState.include_avatar} onChange={onToggleAvatar} className="w-5 h-5 rounded border-2 border-white/30" />
                  <span className="text-sm text-white">Include Avatar</span>
                </label>
              )}
              {bannerUrl && (
                <label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                  <input type="checkbox" checked={templateState.include_banner} onChange={onToggleBanner} className="w-5 h-5 rounded border-2 border-white/30" />
                  <span className="text-sm text-white">Include Banner</span>
                </label>
              )}
            </div>
          )}
          {templateState.included_sections.includes('intro') && (
            <div className="flex flex-col items-center">
              {avatarUrl && templateState.include_avatar && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 mb-6 shadow-2xl">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">{portfolioData.name}</h1>
              <p className="text-2xl md:text-3xl text-orange-100 mb-6 font-light">{portfolioData.title}</p>
              {(editMode || portfolioData.bio) && (
                editMode ? (
                  <CollapsibleTextarea
                    value={portfolioData.bio || ''}
                    onChange={(e) => onUpdateBio?.(e.target.value)}
                    placeholder="Enter your bio..."
                    className="w-full max-w-3xl mx-auto p-3 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50"
                    expandKey="bio"
                    expanded={!!expandedTextareas?.['bio']}
                    onToggle={onToggleTextarea || (() => {})}
                    defaultRows={5}
                  />
                ) : (
                  portfolioData.bio && (
                    <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
                      {portfolioData.bio}
                    </p>
                  )
                )
              )}
              {portfolioData.yearsExperience && (
                <div className="mt-8 text-xl text-orange-100 font-semibold">
                  {portfolioData.yearsExperience}+ Years Experience
                </div>
              )}
            </div>
          )}
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Main Content - Single Page Flow */}
      <div className="max-w-7xl mx-auto px-8">
        {/* Intro Video - Full Width Section */}
        {introVideoUrl && templateState.include_intro_video && (
          <section className="py-16 relative">
            {editMode && (
              <div className="mb-4 flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateState.include_intro_video}
                    onChange={onToggleIntroVideo}
                    className="w-5 h-5 rounded border-2 border-orange-500"
                  />
                  <span className="text-sm text-slate-600">Include Intro Video</span>
                </label>
              </div>
            )}
            <div className="max-w-5xl mx-auto">
              <video src={introVideoUrl} controls className="w-full rounded-2xl shadow-2xl" style={{ maxHeight: '600px' }}>
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        )}

        {/* Skills - Compact Landing Page Section */}
        {templateState.included_sections.includes('skills') && visibleSkills.length > 0 && (
          <section className="py-16 relative bg-gradient-to-br from-orange-50 to-yellow-50">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('skills')} className="w-5 h-5 rounded border-2 border-orange-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-orange-700">Sales Skills</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Core competencies and expertise</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">{(portfolioData.skills || []).map((skill, idx) => {
              const isSelected = templateState.selected_items.skills.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative px-6 py-3 rounded-full text-base font-semibold transition-all ${editMode && !isSelected ? 'bg-slate-100 text-slate-400 line-through' : 'bg-white text-orange-700 border-2 border-orange-300 shadow-md hover:shadow-lg hover:scale-105'}`}>{skill}{editMode && <label className="absolute -top-1 -right-1 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('skills', idx)} className="w-4 h-4 rounded border-2 border-orange-500" /></label>}</div>
            })}</div>
          </section>
        )}

        {/* Experience - Landing Page Timeline */}
        {templateState.included_sections.includes('experience') && visibleExperience.length > 0 && (
          <section className="py-16 relative bg-white">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('experience')} className="w-5 h-5 rounded border-2 border-orange-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-orange-700">Sales Achievements</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Track record of success</p>
            </div>
            <div className="max-w-4xl mx-auto space-y-8">{(portfolioData.experience || []).map((exp, idx) => {
              const isSelected = templateState.selected_items.experience.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative pl-12 border-l-4 border-orange-500 ${editMode && !isSelected ? 'opacity-40' : ''}`}>
                {editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('experience', idx)} className="w-5 h-5 rounded border-2 border-orange-500" /></label>}
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-lg"></div>
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="font-bold text-xl text-orange-700 mb-1">{exp.title || exp.role || 'Role'}</div>
                  <div className="text-orange-600 mb-3 font-semibold">{exp.company || 'Company'}</div>
                  {exp.description && <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.description}</p>}
                </div>
              </div>
            })}</div>
          </section>
        )}

        {/* Projects - Landing Page Grid */}
        {templateState.included_sections.includes('projects') && visibleProjects.length > 0 && (
          <section className="py-16 relative bg-gradient-to-br from-slate-50 to-orange-50">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('projects')} className="w-5 h-5 rounded border-2 border-orange-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-orange-700">Key Deals & Wins</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Notable sales achievements</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">{(portfolioData.projects || []).map((project, idx) => {
              const isSelected = templateState.selected_items.projects.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 ${editMode && !isSelected ? 'opacity-40' : ''}`}>
                {editMode && <label className="absolute top-2 right-2 cursor-pointer z-10"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('projects', idx)} className="w-5 h-5 rounded border-2 border-orange-500" /></label>}
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-orange-700 mb-2">{project.name || project.title || 'Project'}</h3>
                {project.description && <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{project.description}</p>}
              </div>
            })}</div>
          </section>
        )}

        {/* Education - Compact Landing Page Section */}
        {templateState.included_sections.includes('education') && visibleEducation.length > 0 && (
          <section className="py-16 relative bg-white">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('education')} className="w-5 h-5 rounded border-2 border-orange-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-orange-700">Education & Qualifications</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">{(portfolioData.education || []).map((edu, idx) => {
              const isSelected = templateState.selected_items.education.includes(idx)
              if (!editMode && !isSelected) return null
              const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
              return <div key={idx} className={`relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow ${editMode && !isSelected ? 'opacity-40' : ''}`}>
                {editMode && <label className="absolute top-2 right-2 cursor-pointer z-10"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('education', idx)} className="w-5 h-5 rounded border-2 border-orange-500" /></label>}
                <div className="font-bold text-xl text-orange-700 mb-2">{edu?.degree || edu?.qualification || 'Degree'}</div>
                <div className="text-orange-600 mb-3 font-semibold">{edu?.institution || edu?.school || 'Institution'}{edu?.year && ` • ${edu.year}`}</div>
                {edu?.notes && <p className="text-slate-700 whitespace-pre-wrap text-sm mb-3">{edu.notes}</p>}
                {attachmentIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div>
                    <div className="space-y-2">
                      {attachmentIds.slice(0, 2).map((id: any) => {
                        const numId = typeof id === 'number' ? id : Number(id)
                        if (!Number.isFinite(numId) || numId <= 0) return null
                        const it = tbItemCache[numId]
                        if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-white rounded">Loading…</div>
                        return <div key={numId} className="flex items-center gap-2 p-2 bg-white rounded text-xs">
                          <div className="text-slate-700 font-medium">{it?.title || 'Document'}</div>
                        </div>
                      })}
                      {attachmentIds.length > 2 && <div className="text-xs text-slate-400">+{attachmentIds.length - 2} more…</div>}
                    </div>
                  </div>
                )}
              </div>
            })}</div>
          </section>
        )}

        {/* Referees - Compact Landing Page Section */}
        {templateState.included_sections.includes('referees') && visibleReferees.length > 0 && (
          <section className="py-16 relative bg-gradient-to-br from-slate-50 to-orange-50">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('referees')} className="w-5 h-5 rounded border-2 border-orange-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-orange-700">Professional References</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">{(portfolioData.referees || []).map((ref, idx) => {
              const isSelected = templateState.selected_items.referees.includes(idx)
              if (!editMode && !isSelected) return null
              const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
              return <div key={idx} className={`relative bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow ${editMode && !isSelected ? 'opacity-40' : ''}`}>
                {editMode && <label className="absolute top-2 right-2 cursor-pointer z-10"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('referees', idx)} className="w-5 h-5 rounded border-2 border-orange-500" /></label>}
                <div className="font-bold text-xl text-orange-700 mb-2">{ref?.name || 'Referee'}</div>
                <div className="text-orange-600 mb-3 font-semibold">{ref?.title && `${ref.title} • `}{ref?.company || ''}</div>
                {(ref?.email || ref?.phone) && <div className="text-slate-600 text-sm mb-3 space-y-1">{ref?.email && <div>📧 {ref.email}</div>}{ref?.phone && <div>📞 {ref.phone}</div>}</div>}
                {ref?.notes && <p className="text-slate-700 whitespace-pre-wrap text-sm mb-3">{ref.notes}</p>}
                {attachmentIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div>
                    <div className="space-y-2">
                      {attachmentIds.slice(0, 2).map((id: any) => {
                        const numId = typeof id === 'number' ? id : Number(id)
                        if (!Number.isFinite(numId) || numId <= 0) return null
                        const it = tbItemCache[numId]
                        if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading…</div>
                        return <div key={numId} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-xs">
                          <div className="text-slate-700 font-medium">{it?.title || 'Document'}</div>
                        </div>
                      })}
                      {attachmentIds.length > 2 && <div className="text-xs text-slate-400">+{attachmentIds.length - 2} more…</div>}
                    </div>
                  </div>
                )}
              </div>
            })}</div>
          </section>
        )}

        {/* Attachments - Landing Page Grid */}
        {templateState.included_sections.includes('attachments') && visibleAttachments.length > 0 && (
          <section className="py-16 relative bg-white">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('attachments')} className="w-5 h-5 rounded border-2 border-orange-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-orange-700">Documents & Resources</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">{(portfolioData.attachments || []).map((att, idx) => {
              const isSelected = templateState.selected_items.attachments.includes(idx)
              if (!editMode && !isSelected) return null
              const url = attachmentUrls[idx]
              return <div key={idx} className={`relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 ${editMode && !isSelected ? 'opacity-40' : ''}`}>
                {editMode && <label className="absolute top-2 right-2 cursor-pointer z-10"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('attachments', idx)} className="w-5 h-5 rounded border-2 border-orange-500" /></label>}
                {url && <a href={url} target="_blank" rel="noopener noreferrer" className="block text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-orange-700 mb-1">{att?.title || 'Attachment'}</div>
                  <div className="text-xs text-slate-500">{att?.file_type || att?.item_type || ''}</div>
                </a>}
              </div>
            })}</div>
          </section>
        )}

        {/* Social Links - Landing Page CTA Footer */}
        {templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0 && (
          <section className="py-20 relative bg-gradient-to-br from-orange-600 via-yellow-500 to-orange-700 text-white">
            {editMode && <div className="mb-4 flex justify-end"><label className="flex items-center gap-2 cursor-pointer bg-black/50 px-3 py-1 rounded backdrop-blur-sm"><input type="checkbox" checked={true} onChange={() => onToggleSection('social')} className="w-5 h-5 rounded border-2 border-white/30" /><span className="text-sm text-white">Include Section</span></label></div>}
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-6">Let's Connect</h2>
              <p className="text-xl text-orange-100 mb-8">Get in touch through your preferred platform</p>
              <div className="flex flex-wrap justify-center gap-4">{(portfolioData.socialLinks || []).map((link, idx) => <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 font-semibold transition-all hover:scale-105 border border-white/20">{link.platform || link.label || 'Link'}</a>)}</div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
