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
export default function UXResearcherLayout(props: LayoutProps) {
  const { portfolioData, templateState, editMode, onToggleSection, onToggleItem, onToggleAvatar, onToggleBanner, onToggleIntroVideo,
  onUpdateBio, avatarUrl, introVideoUrl, tbItemCache, expandedTextareas = {}, onToggleTextarea } = props
  const visibleSkills = (portfolioData.skills || []).filter((_, i) => templateState.selected_items.skills.includes(i))
  const visibleExperience = (portfolioData.experience || []).filter((_, i) => templateState.selected_items.experience.includes(i))
  const visibleProjects = (portfolioData.projects || []).filter((_, i) => templateState.selected_items.projects.includes(i))
  const visibleEducation = (portfolioData.education || []).filter((_, i) => templateState.selected_items.education.includes(i))
  const visibleReferees = (portfolioData.referees || []).filter((_, i) => templateState.selected_items.referees.includes(i))
  const visibleAttachments = (portfolioData.attachments || []).filter((_, i) => templateState.selected_items.attachments.includes(i))
  return (
    <div className="min-h-screen bg-indigo-50 text-slate-900">
      <div className="bg-white border-b-4 border-indigo-500">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {templateState.included_sections.includes('intro') && (
            <div className="flex items-start gap-6 relative">
              {editMode && (
                <div className="absolute top-0 right-0 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={templateState.included_sections.includes('intro')} onChange={() => onToggleSection('intro')} className="w-5 h-5 rounded border-2 border-indigo-500" />
                    <span className="text-sm text-indigo-700">Include Intro</span>
                  </label>
                  {avatarUrl && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={templateState.include_avatar} onChange={onToggleAvatar} className="w-5 h-5 rounded border-2 border-indigo-500" />
                      <span className="text-sm text-indigo-700">Include Avatar</span>
                    </label>
                  )}
                </div>
              )}
              {avatarUrl && templateState.include_avatar && <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-indigo-300"><img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>}
              <div>
                <h1 className="text-3xl font-bold text-indigo-700 mb-1">{portfolioData.name}</h1>
                <p className="text-lg text-indigo-600 mb-3">{portfolioData.title}</p>
                {(editMode || portfolioData.bio) && (
                  editMode ? (
                    <CollapsibleTextarea
                      value={portfolioData.bio || ''}
                      onChange={(e) => onUpdateBio?.(e.target.value)}
                      placeholder="Enter your bio..."
                      className="w-full max-w-2xl p-3 rounded bg-white border border-indigo-300 text-slate-900 placeholder:text-slate-500"
                      expandKey="bio"
                      expanded={!!expandedTextareas?.['bio']}
                      onToggle={onToggleTextarea || (() => {})}
                      defaultRows={5}
                    />
                  ) : (
                    portfolioData.bio && <p className="text-slate-700 max-w-2xl whitespace-pre-wrap">{portfolioData.bio}</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-10">
        {introVideoUrl && templateState.include_intro_video && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4 flex justify-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={templateState.include_intro_video} onChange={onToggleIntroVideo} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Intro Video</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Introduction Video</h2>
            <div className="max-w-4xl mx-auto"><video src={introVideoUrl} controls className="w-full rounded-lg border-2 border-indigo-200" style={{ maxHeight: '600px' }}>Your browser does not support the video tag.</video></div>
          </section>
        )}
        {templateState.included_sections.includes('skills') && visibleSkills.length > 0 && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('skills')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Research Methods & Tools</h2>
            <div className="flex flex-wrap gap-2">{(portfolioData.skills || []).map((skill, idx) => {
              const isSelected = templateState.selected_items.skills.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative px-3 py-1 rounded text-sm ${editMode && !isSelected ? 'bg-slate-100 text-slate-400 line-through' : 'bg-indigo-100 text-indigo-700 border border-indigo-300'}`}>{skill}{editMode && <label className="absolute -top-1 -right-1 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('skills', idx)} className="w-4 h-4 rounded border-2 border-indigo-500" /></label>}</div>
            })}</div>
          </section>
        )}
        {templateState.included_sections.includes('experience') && visibleExperience.length > 0 && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('experience')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Research Experience</h2>
            <div className="space-y-4">{(portfolioData.experience || []).map((exp, idx) => {
              const isSelected = templateState.selected_items.experience.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative pl-6 border-l-4 border-indigo-400 ${editMode && !isSelected ? 'opacity-40' : 'bg-white p-4 rounded-lg'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('experience', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<div className="font-bold text-indigo-700">{exp.title || exp.role || 'Role'}</div><div className="text-indigo-600 mb-2">{exp.company || 'Company'}</div>{exp.description && <p className="text-slate-700 whitespace-pre-wrap">{exp.description}</p>}</div>
            })}</div>
          </section>
        )}
        {templateState.included_sections.includes('projects') && visibleProjects.length > 0 && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('projects')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Case Studies</h2>
            <div className="grid md:grid-cols-2 gap-4">{(portfolioData.projects || []).map((project, idx) => {
              const isSelected = templateState.selected_items.projects.includes(idx)
              if (!editMode && !isSelected) return null
              return <div key={idx} className={`relative border-2 border-indigo-200 rounded-lg p-4 bg-white ${editMode && !isSelected ? 'opacity-40' : ''}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('projects', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<h3 className="font-bold text-indigo-700 mb-2">{project.name || project.title || 'Project'}</h3>{project.description && <p className="text-slate-700 whitespace-pre-wrap">{project.description}</p>}</div>
            })}</div>
          </section>
        )}
        {templateState.included_sections.includes('education') && visibleEducation.length > 0 && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('education')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Education</h2>
            <div className="space-y-4">{(portfolioData.education || []).map((edu, idx) => {
              const isSelected = templateState.selected_items.education.includes(idx)
              if (!editMode && !isSelected) return null
              const attachmentIds = Array.isArray(edu?.attachmentIds) ? edu.attachmentIds : []
              return <div key={idx} className={`relative pl-6 border-l-4 border-indigo-400 ${editMode && !isSelected ? 'opacity-40' : 'bg-white p-4 rounded-lg'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('education', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<div className="font-bold text-indigo-700">{edu?.degree || edu?.qualification || 'Degree'}</div><div className="text-indigo-600 mb-2">{edu?.institution || edu?.school || 'Institution'}{edu?.year && ` • ${edu.year}`}</div>{edu?.notes && <p className="text-slate-700 whitespace-pre-wrap">{edu.notes}</p>}{attachmentIds.length > 0 && <div className="mt-4"><div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div><div className="space-y-2">{attachmentIds.slice(0, 3).map((id: any) => {const numId = typeof id === 'number' ? id : Number(id);if (!Number.isFinite(numId) || numId <= 0) return null;const it = tbItemCache[numId];if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>;return <div key={numId} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-indigo-200"><div className="text-sm text-slate-700">{it?.title || 'Document'}</div><div className="text-xs text-slate-500">{it?.item_type || ''}</div></div>})}{attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}</div></div>}
            </div>
          })}
            </div>
          </section>
        )}
        {templateState.included_sections.includes('referees') && visibleReferees.length > 0 && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('referees')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Referees</h2>
            <div className="space-y-4">{(portfolioData.referees || []).map((ref, idx) => {
              const isSelected = templateState.selected_items.referees.includes(idx)
              if (!editMode && !isSelected) return null
              const attachmentIds = Array.isArray(ref?.attachmentIds) ? ref.attachmentIds : []
              return <div key={idx} className={`relative pl-6 border-l-4 border-indigo-400 ${editMode && !isSelected ? 'opacity-40' : 'bg-white p-4 rounded-lg'}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('referees', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}<div className="font-bold text-indigo-700">{ref?.name || 'Referee'}</div><div className="text-indigo-600 mb-2">{ref?.title && `${ref.title} • `}{ref?.company || ''}</div>{(ref?.email || ref?.phone) && <div className="text-slate-600 text-sm mb-2">{ref?.email && <div>Email: {ref.email}</div>}{ref?.phone && <div>Phone: {ref.phone}</div>}</div>}{ref?.notes && <p className="text-slate-700 whitespace-pre-wrap">{ref.notes}</p>}{attachmentIds.length > 0 && <div className="mt-4"><div className="text-xs text-slate-500 mb-2">Attached documents: <span className="text-slate-700 font-semibold">{attachmentIds.length}</span></div><div className="space-y-2">{attachmentIds.slice(0, 3).map((id: any) => {const numId = typeof id === 'number' ? id : Number(id);if (!Number.isFinite(numId) || numId <= 0) return null;const it = tbItemCache[numId];if (!it) return <div key={numId} className="text-xs text-slate-400 p-2 bg-slate-50 rounded">Loading document {numId}…</div>;return <div key={numId} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-indigo-200"><div className="text-sm text-slate-700">{it?.title || 'Document'}</div><div className="text-xs text-slate-500">{it?.item_type || ''}</div></div>})}{attachmentIds.length > 3 && <div className="text-xs text-slate-400">+{attachmentIds.length - 3} more…</div>}</div></div>}
            </div>
          })}
            </div>
          </section>
        )}
        {templateState.included_sections.includes('attachments') && visibleAttachments.length > 0 && (
          <section className="mb-10 relative">
            {editMode && <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('attachments')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Attachments</h2>
            <div className="grid md:grid-cols-2 gap-4">{(portfolioData.attachments || []).map((att, idx) => {
              const isSelected = templateState.selected_items.attachments.includes(idx)
              if (!editMode && !isSelected) return null
              const url = props.attachmentUrls[idx]
              return <div key={idx} className={`relative border-2 border-indigo-200 rounded-lg p-4 bg-white ${editMode && !isSelected ? 'opacity-40' : ''}`}>{editMode && <label className="absolute top-2 right-2 cursor-pointer"><input type="checkbox" checked={isSelected} onChange={() => onToggleItem('attachments', idx)} className="w-5 h-5 rounded border-2 border-indigo-500" /></label>}{url && <a href={url} target="_blank" rel="noopener noreferrer" className="block"><div className="font-bold text-indigo-700 mb-2">{att?.title || 'Attachment'}</div><div className="text-xs text-slate-500">{att?.file_type || att?.item_type || ''}</div></a>}
            </div>
          })}
            </div>
          </section>
        )}
        {templateState.included_sections.includes('social') && (portfolioData.socialLinks || []).length > 0 && (
          <section className="relative">
            {editMode && <div className="mb-4 flex justify-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={true} onChange={() => onToggleSection('social')} className="w-5 h-5 rounded border-2 border-indigo-500" /><span className="text-sm text-slate-600">Include Section</span></label></div>}
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Connect</h2>
            <div className="flex flex-wrap gap-3">{(portfolioData.socialLinks || []).map((link, idx) => <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border-2 border-indigo-500 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50">{link.platform || link.label || 'Link'}</a>)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
