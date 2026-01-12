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
export default function ResearchScientistLayout(props: LayoutProps) {
  const { portfolioData, templateState, editMode, onToggleSection, onToggleItem, onToggleAvatar, onToggleBanner, onToggleIntroVideo,
  onUpdateBio, avatarUrl, introVideoUrl, attachmentUrls, tbItemCache, expandedTextareas = {}, onToggleTextarea } = props
  const visibleExperience = (portfolioData.experience || []).filter((_, i) => templateState.selected_items.experience.includes(i))
  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleSkills = (portfolioData.skills || []).filter((_, i) => templateState.selected_items.skills.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-slate-900">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          {templateState.included_sections.includes('intro') && (
            <div className="flex items-center gap-6 relative">
              {editMode && (
                <div className="absolute top-0 right-0 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-white/20 px-3 py-1 rounded">
                    <input type="checkbox" checked={templateState.included_sections.includes('intro')} onChange={() => onToggleSection('intro')} className="w-5 h-5 rounded border-2 border-white/30" />
                    <span className="text-sm text-white">Include Intro</span>
                  </label>
                  {avatarUrl && (
                    <label className="flex items-center gap-2 cursor-pointer bg-white/20 px-3 py-1 rounded">
                      <input type="checkbox" checked={templateState.include_avatar} onChange={onToggleAvatar} className="w-5 h-5 rounded border-2 border-white/30" />
                      <span className="text-sm text-white">Include Avatar</span>
                    </label>
                  )}
                </div>
              )}
              {avatarUrl && templateState.include_avatar && <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 bg-white"><img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>}
              <div>
                <h1 className="text-4xl font-bold mb-2">{portfolioData.name}</h1>
                <p className="text-xl text-indigo-100 mb-4">{portfolioData.title}</p>
                {(editMode || portfolioData.bio) && (
                  editMode ? (
                    <CollapsibleTextarea
                      value={portfolioData.bio || ''}
                      onChange={(e) => onUpdateBio?.(e.target.value)}
                      placeholder="Enter your bio..."
                      className="w-full max-w-2xl p-3 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50"
                      expandKey="bio"
                      expanded={!!expandedTextareas['bio']}
                      onToggle={onToggleTextarea || (() => {})}
                      defaultRows={5}
                    />
                  ) : (
                    portfolioData.bio && <p className="text-white/90 max-w-2xl whitespace-pre-wrap">{portfolioData.bio}</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-12">
        {introVideoUrl && templateState.include_intro_video && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4 flex justify-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateState.include_intro_video} onChange={onToggleIntroVideo} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Intro Video</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Introduction Video</h2>
            <div className="max-w-4xl mx-auto"><video src={introVideoUrl} controls className="w-full rounded-lg border-2 border-indigo-200" style={{ maxHeight: '600px' }}>Your browser does not support the video tag.</video></div>
          </section>
        )}
        {templateState.included_sections.includes('skills') && visibleSkills.length > 0 && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('skills')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Research Skills & Methods</h2>
            <div className="flex flex-wrap gap-2">{(portfolioData.skills || []).map((skill, idx) => {
              const isSelected = templateState.selected_items.skills.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative px-4 py-2 rounded text-sm font-semibold ${editMode && !isSelected ? 'bg-slate-100 text-slate-400 line-through' : 'bg-indigo-100 text-indigo-700 border border-indigo-300'}`}>{skill}{editMode && <label className="absolute -top-1 -right-1 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('skills', idx)} className="w-4 h-4 rounded border-2 border-indigo-500" /></label>}</div>
            })}</div>
          </section>
        )}
        {templateState.included_sections.includes('experience') && visibleExperience.length > 0 && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('experience')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Research Experience</h2>
            <div className="space-y-4">{(portfolioData.experience || []).map((exp, idx) => {
              const isSelected = templateState.selected_items.experience.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative pl-6 border-l-4 border-indigo-300 ${editMode && !isSelected ? 'opacity-40' : 'bg-indigo-50 rounded-lg p-4'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('experience', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<div className="font-bold text-lg text-indigo-700">{exp.title || exp.role || 'Role'}</div><div className="text-indigo-600 mb-2">{exp.company || 'Company'}</div>{exp.description && <p className="text-slate-700 whitespace-pre-wrap">{exp.description}</p>}</div>
            })}</div>
          </section>
        )}
        {templateState.included_sections.includes('education') && visibleEducation.length > 0 && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('education')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Academic Background</h2>
            <div className="space-y-4">{(portfolioData.education || []).map((edu, idx) => {
              const isSelected = templateState.selected_items.education.includes(idx)
              if (!editMode && !isSelected) return null
              const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
              return <div key={idx} className={`relative pl-6 border-l-4 border-indigo-300 ${editMode && !isSelected ? 'opacity-40' : 'bg-indigo-50 rounded-lg p-4'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('education', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<div className="font-bold text-lg text-indigo-700">{edu?.degree || edu?.qualification || 'Degree'}</div><div className="text-indigo-600 mb-2">{edu?.institution || edu?.school || 'Institution'}{edu?.year && ` • ${edu.year}`}</div>{edu?.notes && <p className="text-slate-700 whitespace-pre-wrap">{edu.notes}</p>}{attachmentIds.length > 0 && <div className="mt-4"><div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div><div className="space-y-2">{attachmentIds.slice(0, 3).map((id: any) => {const numId = typeof id === 'number' ? id : Number(id);if (!Number.isFinite(numId) || numId <= 0) return null;const it = tbItemCache[numId];if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>;return <div key={numId} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-indigo-200"><div className="text-sm text-slate-700">{it?.title || 'Document'}</div><div className="text-xs text-slate-500">{it?.item_type || ''}</div></div>})}{attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}</div></div>}
            </div>
          })}
            </div>
          </section>
        )}
        {templateState.included_sections.includes('projects') && visibleProjects.length > 0 && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('projects')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Publications & Research</h2>
            <div className="space-y-4">{(portfolioData.projects || []).map((project, idx) => {
              const isSelected = templateState.selected_items.projects.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative border-2 border-indigo-200 rounded-lg p-4 ${editMode && !isSelected ? 'opacity-40' : 'bg-indigo-50'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('projects', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<h3 className="font-bold text-indigo-700 mb-2">{project.name || project.title || 'Project'}</h3>{project.description && <p className="text-slate-700 whitespace-pre-wrap">{project.description}</p>}</div>
            })}</div>
          </section>
        )}
        {templateState.included_sections.includes('referees') && visibleReferees.length > 0 && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('referees')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Referees</h2>
            <div className="space-y-4">{(portfolioData.referees || []).map((ref, idx) => {
              const isSelected = templateState.selected_items.referees.includes(idx)
              if (!editMode && !isSelected) return null
              const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
              return <div key={idx} className={`relative border-2 border-indigo-200 rounded-lg p-4 ${editMode && !isSelected ? 'opacity-40' : 'bg-indigo-50'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('referees', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<div className="font-bold text-indigo-700">{ref?.name || 'Reference'}</div><div className="text-indigo-600 mb-2">{ref?.title && `${ref.title} • `}{ref?.company || ref?.organization || ''}</div>{(ref?.email || ref?.phone) && <div className="text-slate-500 text-sm mb-2">{ref?.email && <div>Email: {ref.email}</div>}{ref?.phone && <div>Phone: {ref.phone}</div>}</div>}{ref?.notes && <p className="text-slate-700 whitespace-pre-wrap">{ref.notes}</p>}{attachmentIds.length > 0 && <div className="mt-4"><div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div><div className="space-y-2">{attachmentIds.slice(0, 3).map((id: any) => {const numId = typeof id === 'number' ? id : Number(id);if (!Number.isFinite(numId) || numId <= 0) return null;const it = tbItemCache[numId];if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>;return <div key={numId} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-indigo-200"><div className="text-sm text-slate-700">{it?.title || 'Document'}</div><div className="text-xs text-slate-500">{it?.item_type || ''}</div></div>})}{attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}</div></div>}
            </div>
          })}
            </div>
          </section>
        )}
        {templateState.included_sections.includes('attachments') && visibleAttachments.length > 0 && (
          <section className="mb-10 relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('attachments')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Attachments</h2>
            <div className="grid md:grid-cols-2 gap-4">{(portfolioData.attachments || []).map((att, idx) => {
              const isSelected = templateState.selected_items.attachments.includes(idx)
              if (!editMode && !isSelected) return null
              const url = attachmentUrls[idx]
              return <div key={idx} className={`relative border-2 border-indigo-200 rounded-lg p-4 ${editMode && !isSelected ? 'opacity-40' : 'bg-indigo-50'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('attachments', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}{url && <a href={url} target="_blank" rel="noopener noreferrer" className="block"><h3 className="font-bold text-indigo-700 mb-2">{att?.title || 'Attachment'}</h3><p className="text-sm text-slate-500">{att?.file_type || att?.item_type || ''}</p></a>}
            </div>
          })}
            </div>
          </section>
        )}
        {templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0 && (
          <section className="relative bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            {editMode && <div className="mb-4 flex justify-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('social')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Connect</h2>
            <div className="flex flex-wrap gap-3">{(portfolioData.socialLinks || []).map((link, idx) => <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors">{link.platform || link.label || 'Link'}</a>)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
