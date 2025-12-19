'use client'

import { useEffect, useState, DragEvent, ChangeEvent } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TalentBankItem {
  id: number
  user_id: number
  item_type: string
  title: string
  description?: string | null
  file_url?: string | null
  file_type?: string | null
  file_size?: number | null
  metadata?: any
  created_at: string
}

type ItemFilter = 'all' | 'document' | 'image' | 'video' | 'experience' | 'education' | 'credential'

const DEFAULT_EMAIL = 'talent@creerlio.local'

export default function TalentBankPage() {
  const router = useRouter()
  const [items, setItems] = useState<TalentBankItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [filter, setFilter] = useState<ItemFilter>('all')

  // Modal state
  const [activeModal, setActiveModal] = useState<null | 'experience' | 'education' | 'credential'>(null)
  const [modalData, setModalData] = useState<Record<string, string>>({})

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    void refreshItems()
  }, [])

  const refreshItems = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${apiUrl}/api/talent-bank/items`, {
        params: { email: DEFAULT_EMAIL }
      })
      setItems(response.data?.items ?? [])
    } catch (error) {
      console.error('Error loading talent bank items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('files', file))

    try {
      setIsUploading(true)
      await axios.post(`${apiUrl}/api/talent-bank/upload`, formData, {
        params: { email: DEFAULT_EMAIL },
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await refreshItems()
    } catch (error) {
      console.error('Error uploading to Talent Bank:', error)
      alert('Error uploading files to Talent Bank')
    } finally {
      setIsUploading(false)
      setDragActive(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    void handleFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files)
  }

  const openModal = (type: 'experience' | 'education' | 'credential') => {
    setActiveModal(type)
    setModalData({})
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalData({})
  }

  const handleModalChange = (field: string, value: string) => {
    setModalData((prev) => ({ ...prev, [field]: value }))
  }

  const handleModalSubmit = async () => {
    if (!activeModal) return

    try {
      const titleField =
        activeModal === 'experience'
          ? modalData.title || modalData.company
          : activeModal === 'education'
          ? modalData.institution
          : modalData.name

      if (!titleField) {
        alert('Please provide at least a title/name')
        return
      }

      const payload = {
        item_type: activeModal,
        title: titleField,
        description: modalData.description || null,
        metadata: modalData
      }

      await axios.post(`${apiUrl}/api/talent-bank/items`, payload, {
        params: { email: DEFAULT_EMAIL }
      })

      closeModal()
      await refreshItems()
    } catch (error) {
      console.error('Error creating structured talent bank item:', error)
      alert('Error saving item')
    }
  }

  const filteredItems =
    filter === 'all' ? items : items.filter((item) => item.item_type === filter)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/dashboard/talent" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Talent Bank</span>
        </Link>

        <button
          onClick={() => router.push('/dashboard/talent')}
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Your Talent Bank</h1>
          <p className="text-gray-400">
            Store and manage all your career assets in one place. Files live in Supabase
            Storage, and structured records power your portfolio and applications.
          </p>
        </div>

        {/* Upload + Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-gray-700 bg-slate-900/40'
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => document.getElementById('talent-bank-file-input')?.click()}
          >
            <input
              id="talent-bank-file-input"
              type="file"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
            <p className="text-gray-300 font-medium mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-gray-500 text-sm">
              Documents, images, videos and more. Files are stored per-user in Supabase Storage.
            </p>
            {isUploading && (
              <p className="mt-3 text-blue-400 text-sm">Uploading to Talent Bank...</p>
            )}
          </div>

          <div className="bg-slate-900/60 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Add Structured Records</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => openModal('experience')}
                className="w-full px-4 py-2 bg-blue-500/20 border border-blue-500/60 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-left"
              >
                Add Experience
              </button>
              <button
                type="button"
                onClick={() => openModal('education')}
                className="w-full px-4 py-2 bg-emerald-500/20 border border-emerald-500/60 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-colors text-left"
              >
                Add Education
              </button>
              <button
                type="button"
                onClick={() => openModal('credential')}
                className="w-full px-4 py-2 bg-purple-500/20 border border-purple-500/60 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors text-left"
              >
                Add Credential
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-gray-400 text-sm">Filter by type:</span>
          {(['all', 'document', 'image', 'video', 'experience', 'education', 'credential'] as ItemFilter[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === t
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Items Grid */}
        <div className="bg-slate-900/60 border border-gray-800 rounded-xl p-6">
          {isLoading ? (
            <p className="text-gray-400">Loading your Talent Bank...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No items yet. Upload files or add structured records to build your Talent Bank.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-800 rounded-lg p-4 bg-slate-900/80 hover:border-blue-500/60 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold line-clamp-2">{item.title}</h3>
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-full bg-slate-800 text-gray-300 ml-2">
                      {item.item_type}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-3">{item.description}</p>
                  )}
                  {item.item_type === 'experience' && item.metadata && (
                    <p className="text-gray-400 text-xs mb-1">
                      {item.metadata.title} • {item.metadata.company}
                    </p>
                  )}
                  {item.item_type === 'education' && item.metadata && (
                    <p className="text-gray-400 text-xs mb-1">
                      {item.metadata.degree} • {item.metadata.institution}
                    </p>
                  )}
                  {item.item_type === 'credential' && item.metadata && (
                    <p className="text-gray-400 text-xs mb-1">
                      {item.metadata.issuer} • {item.metadata.name}
                    </p>
                  )}
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Open file
                    </a>
                  )}
                  <p className="text-gray-600 text-[11px] mt-2">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Structured Form Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              {activeModal === 'experience'
                ? 'Add Experience'
                : activeModal === 'education'
                ? 'Add Education'
                : 'Add Credential'}
            </h2>
            <div className="space-y-3">
              {activeModal === 'experience' && (
                <>
                  <input
                    type="text"
                    placeholder="Company"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.company || ''}
                    onChange={(e) => handleModalChange('company', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.title || ''}
                    onChange={(e) => handleModalChange('title', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Start Date"
                      className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                      value={modalData.startDate || ''}
                      onChange={(e) => handleModalChange('startDate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="End Date"
                      className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                      value={modalData.endDate || ''}
                      onChange={(e) => handleModalChange('endDate', e.target.value)}
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    rows={3}
                    value={modalData.description || ''}
                    onChange={(e) => handleModalChange('description', e.target.value)}
                  />
                </>
              )}

              {activeModal === 'education' && (
                <>
                  <input
                    type="text"
                    placeholder="Institution"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.institution || ''}
                    onChange={(e) => handleModalChange('institution', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Degree"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.degree || ''}
                    onChange={(e) => handleModalChange('degree', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Field of Study"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.field || ''}
                    onChange={(e) => handleModalChange('field', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Year / Completion"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.year || ''}
                    onChange={(e) => handleModalChange('year', e.target.value)}
                  />
                </>
              )}

              {activeModal === 'credential' && (
                <>
                  <input
                    type="text"
                    placeholder="Credential Name"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.name || ''}
                    onChange={(e) => handleModalChange('name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Issuer"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.issuer || ''}
                    onChange={(e) => handleModalChange('issuer', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Issued Date"
                      className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                      value={modalData.issuedDate || ''}
                      onChange={(e) => handleModalChange('issuedDate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Expiry Date (optional)"
                      className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                      value={modalData.expiryDate || ''}
                      onChange={(e) => handleModalChange('expiryDate', e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Credential ID (optional)"
                    className="w-full p-2 rounded border border-gray-700 bg-slate-950 text-white text-sm"
                    value={modalData.credentialId || ''}
                    onChange={(e) => handleModalChange('credentialId', e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


