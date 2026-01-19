'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PortfolioShareConfig, { ShareConfig } from '@/components/PortfolioShareConfig'
import { buildSharedPayload, createPortfolioSnapshot } from '@/lib/portfolioSnapshots'
import { TemplateId } from '@/components/portfolioTemplates'

let pdfJsLibPromise: Promise<any> | null = null
function loadPdfJsLib() {
  if (pdfJsLibPromise) return pdfJsLibPromise
  pdfJsLibPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('pdfjs can only load in the browser'))
    const w = window as any
    if (w.pdfjsLib) return resolve(w.pdfjsLib)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      if (w.pdfjsLib) {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(w.pdfjsLib)
      } else {
        reject(new Error('Failed to load pdfjs'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load pdfjs script'))
    document.head.appendChild(script)
  })
  return pdfJsLibPromise
}

function CollapsibleTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  expandKey,
  defaultRows = 5,
  expanded,
  onToggle,
  showVoiceButtons = true,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  expandKey: string
  defaultRows?: number
  expanded: boolean
  onToggle: (key: string) => void
  showVoiceButtons?: boolean
}) {
  const [isListening, setIsListening] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [interimText, setInterimText] = useState('')
  const baseValueRef = useRef<string>('')
  const finalTranscriptRef = useRef<string>('')
  const shouldContinueListeningRef = useRef<boolean>(false) // Track if we should restart on end
  const lineCount = String((value || '') + interimText).split('\n').length
  const needsExpansion = lineCount > defaultRows || String((value || '') + interimText).length > 200

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      // Update final transcript ref
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript
        // Update the actual value with finalized text
        const newValue = baseValueRef.current + finalTranscriptRef.current
        baseValueRef.current = newValue // Update base to include finalized text
        finalTranscriptRef.current = '' // Clear final transcript ref since it's now in base
        onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>)
      }

      // Update interim text for real-time display
      setInterimText(interimTranscript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      shouldContinueListeningRef.current = false // Stop trying to continue on error
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please enable microphone permissions in your browser settings.')
      }
    }

    recognition.onend = () => {
      // Only restart if we're still supposed to be listening (user hasn't clicked STOP)
      // Use ref to check current state (closure-safe)
      if (shouldContinueListeningRef.current) {
        // Restart recognition to continue recording until user clicks STOP
        try {
          recognition.start()
        } catch (error: any) {
          // If restart fails (e.g., already starting), just continue
          // The recognition will restart automatically
          if (error.name !== 'InvalidStateError') {
            console.error('Error restarting speech recognition:', error)
            setIsListening(false)
            shouldContinueListeningRef.current = false
          }
        }
      } else {
        // User explicitly stopped, don't restart
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [value, onChange])

  // Update base value ref when value prop changes (but not from speech recognition)
  useEffect(() => {
    if (!isListening) {
      baseValueRef.current = value || ''
      finalTranscriptRef.current = ''
    }
  }, [value, isListening])

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not available in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      // Store the current value as the base value when starting to listen
      baseValueRef.current = value || ''
      finalTranscriptRef.current = ''
      setInterimText('')
      shouldContinueListeningRef.current = true // Set flag to continue listening
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      shouldContinueListeningRef.current = false
      if (error.name === 'InvalidStateError') {
        // Already listening or already started
        setIsListening(false)
      } else {
        alert('Error starting speech recognition. Please try again.')
      }
    }
  }

  const stopListening = () => {
    // Set flag to false first to prevent onend from restarting
    shouldContinueListeningRef.current = false
    setIsListening(false)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
    // Clear interim text when stopping
    setInterimText('')
  }

  const handlePolishText = async () => {
    if (!value || !value.trim()) {
      alert('Please enter some text to polish.')
      return
    }

    setIsPolishing(true)
    try {
      const response = await fetch('/api/ai/polish-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: value }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to polish text')
      }

      const data = await response.json()
      if (data.success && data.polished_text) {
        onChange({ target: { value: data.polished_text } } as React.ChangeEvent<HTMLTextAreaElement>)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error polishing text:', error)
      const msg = String(error?.message || 'Failed to polish text. Please check your OpenAI API key is configured.')
      const safeMsg = msg.replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
      alert(safeMsg)
    } finally {
      setIsPolishing(false)
    }
  }

  // Display value with interim text appended for real-time feedback
  const displayValue = (value || '') + (interimText || '')

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={displayValue}
        onChange={onChange}
        disabled={disabled}
        className={className}
        rows={expanded ? Math.max(defaultRows, lineCount) : defaultRows}
      />
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {showVoiceButtons && !disabled && (
          <>
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded disabled:opacity-50 transition-colors flex items-center gap-1"
                title="Start voice input (Talk to TXT)"
              >
                🎤 Talk to TXT
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded disabled:opacity-50 transition-colors flex items-center gap-1"
                title="Stop voice input"
              >
                ⏹ Stop
              </button>
            )}
            <button
              type="button"
              onClick={handlePolishText}
              disabled={isPolishing || !value || !value.trim()}
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50 transition-colors flex items-center gap-1"
              title="AI Polish - Fix grammar, spelling, and improve style"
            >
              {isPolishing ? '⏳ Polishing...' : '✨ AI Polish'}
            </button>
          </>
        )}
      {needsExpansion && (
        <button
          type="button"
          onClick={() => onToggle(expandKey)}
            className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 transition-colors"
          disabled={disabled}
        >
          {expanded ? '▲ Show Less' : '▼ Show More'}
        </button>
      )}
      </div>
    </div>
  )
}

interface PortfolioData {
  name: string
  title: string
  bio: string
  avatar_path?: string | null
  banner_path?: string | null
  sectionOrder?: string[]
  introVideoId?: number | null
  socialLinks: Array<{
    platform: string
    url: string
  }>
  skills: string[]
  experience: Array<{
    company: string
    title: string
    startDate: string
    endDate: string
    description: string
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    year: string
    attachmentIds?: number[]
  }>
  referees: Array<{
    name: string
    relationship: string
    company: string
    title: string
    email: string
    phone: string
    notes: string
    attachmentIds?: number[]
  }>
  attachments: Array<{
    id: number
    title: string
    item_type: string
    file_path: string | null
    file_type: string | null
    url: string | null
  }>
  projects: Array<{
    name: string
    description: string
    url: string
    attachmentIds?: number[]
  }>
  personal_documents: Array<{
    title: string
    description?: string
    attachmentIds?: number[]
  }>
  licences_accreditations: Array<{
    title: string
    description?: string
    issueDate?: string
    expiryDate?: string
    issuer?: string
    attachmentIds?: number[]
  }>
  family_community?: {
    imageIds?: number[]
    descriptions?: Record<number, string> // Map of imageId to description
  }
}

interface TalentBankItem {
  id: number
  item_type: string
  title: string
  metadata?: any
  file_path?: string | null
  file_type?: string | null
  created_at?: string
}

export default function PortfolioEditor() {
  const router = useRouter()
  const DEFAULT_SECTION_ORDER = ['intro', 'social', 'skills', 'experience', 'education', 'referees', 'projects', 'personal_documents', 'licences_accreditations', 'family_community', 'attachments'] as const
  type SectionKey = (typeof DEFAULT_SECTION_ORDER)[number]
  const SOCIAL_PLATFORMS = [
    'LinkedIn',
    'GitHub',
    'YouTube',
    'X',
    'Instagram',
    'Facebook',
    'TikTok',
    'Behance',
    'Dribbble',
    'Website',
  ] as const
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    name: '',
    title: '',
    bio: '',
    avatar_path: null,
    banner_path: null,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    introVideoId: null,
    socialLinks: [],
    skills: [],
    experience: [],
    education: [],
    referees: [],
    attachments: [],
    projects: [],
    personal_documents: [],
    licences_accreditations: [],
    family_community: { imageIds: [], descriptions: {} }
  })

  const [newSkill, setNewSkill] = useState('')
  type BulkSection = 'skills' | 'experience' | 'education' | 'referees' | 'attachments' | 'projects' | 'personal_documents' | 'licences_accreditations' | 'family_community'
  const [bulkSel, setBulkSel] = useState<Record<BulkSection, Record<string, boolean>>>({
    skills: {},
    experience: {},
    education: {},
    referees: {},
    attachments: {},
    projects: {},
    personal_documents: {},
    licences_accreditations: {},
    family_community: {},
  })
  
  // Autocomplete state for Licences and Accreditations
  const [licenceTitleSuggestions, setLicenceTitleSuggestions] = useState<Record<number, Array<{name: string, jurisdiction: string, issuing_authority?: string}>>>({})
  const [licenceIssuerSuggestions, setLicenceIssuerSuggestions] = useState<Record<number, string[]>>({})
  const [activeTitleAutocompleteIndex, setActiveTitleAutocompleteIndex] = useState<number | null>(null)
  const [activeIssuerAutocompleteIndex, setActiveIssuerAutocompleteIndex] = useState<number | null>(null)
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<Record<number, number>>({})
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({})
  const [sectionEdit, setSectionEdit] = useState<Record<string, boolean>>({
    basic: true,
    social: true,
    skills: true,
    experience: true,
    education: true,
    referees: true,
    attachments: true,
    projects: true,
    personal_documents: true,
    licences_accreditations: true,
    family_community: true,
  })
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [availableItems, setAvailableItems] = useState<TalentBankItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>({})
  const [importError, setImportError] = useState<string | null>(null)
  // Shared upload state for all import modals
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [projectImportOpen, setProjectImportOpen] = useState(false)
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null)
  const [projectSelectedIds, setProjectSelectedIds] = useState<Record<number, boolean>>({})
  const [educationImportOpen, setEducationImportOpen] = useState(false)
  const [activeEducationIndex, setActiveEducationIndex] = useState<number | null>(null)
  const [educationSelectedIds, setEducationSelectedIds] = useState<Record<number, boolean>>({})
  const [refereeImportOpen, setRefereeImportOpen] = useState(false)
  const [activeRefereeIndex, setActiveRefereeIndex] = useState<number | null>(null)
  const [refereeSelectedIds, setRefereeSelectedIds] = useState<Record<number, boolean>>({})
  const [personalDocImportOpen, setPersonalDocImportOpen] = useState(false)
  const [activePersonalDocIndex, setActivePersonalDocIndex] = useState<number | null>(null)
  const [personalDocSelectedIds, setPersonalDocSelectedIds] = useState<Record<number, boolean>>({})
  const [licenceImportOpen, setLicenceImportOpen] = useState(false)
  const [activeLicenceIndex, setActiveLicenceIndex] = useState<number | null>(null)
  const [licenceSelectedIds, setLicenceSelectedIds] = useState<Record<number, boolean>>({})
  const [familyCommunityImportOpen, setFamilyCommunityImportOpen] = useState(false)
  const [familyCommunitySelectedIds, setFamilyCommunitySelectedIds] = useState<Record<number, boolean>>({})
  const [familyCommunityUploadUrl, setFamilyCommunityUploadUrl] = useState('')
  const [familyCommunityUploading, setFamilyCommunityUploading] = useState(false)
  const familyCommunityFileInputRef = useRef<HTMLInputElement | null>(null)
  const [familyCommunityExpanded, setFamilyCommunityExpanded] = useState(false)
  const [familyCommunityEditImage, setFamilyCommunityEditImage] = useState<number | null>(null) // Image ID being edited
  const [familyCommunityEditDescription, setFamilyCommunityEditDescription] = useState<string>('')
  const [layoutExpanded, setLayoutExpanded] = useState(false)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [tbItemCache, setTbItemCache] = useState<Record<number, TalentBankItem>>({})
  const [preview, setPreview] = useState<
    | { kind: 'image'; url: string; title: string }
    | { kind: 'video'; url: string; title: string }
    | null
  >(null)

  const [layoutDragIndex, setLayoutDragIndex] = useState<number | null>(null)
  const [introModalOpen, setIntroModalOpen] = useState(false)
  
  // Track expanded state for textareas (key format: "section-index" or "section")
  const [expandedTextareas, setExpandedTextareas] = useState<Record<string, boolean>>({})
  
  // Helper function to toggle textarea expansion
  const toggleTextarea = (key: string) => {
    setExpandedTextareas(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const [introItems, setIntroItems] = useState<TalentBankItem[]>([])
  const [introPickId, setIntroPickId] = useState<number | null>(null)
  const [introPreviewUrl, setIntroPreviewUrl] = useState<string | null>(null)

  // Share configuration and template selection state
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null)
  const [talentProfileId, setTalentProfileId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Load existing saved portfolio (if present)
    loadSavedPortfolio()
    
    // Reload template ID when component mounts or when returning from template selection
    const reloadTemplateId = async () => {
      try {
        const uid = await getUserId()
        if (!uid) return
        
        const { data } = await supabase
          .from('talent_bank_items')
          .select('metadata')
          .eq('user_id', uid)
          .eq('item_type', 'portfolio')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (data?.metadata && (data.metadata as any).selected_template_id) {
          setSelectedTemplateId((data.metadata as any).selected_template_id)
        }
      } catch (error) {
        console.error('Error reloading template ID:', error)
      }
    }
    
    reloadTemplateId()
    
    // Reload template ID when page becomes visible (user returns from template selection)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reloadTemplateId()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Load talent profile ID and user ID
    async function loadProfileIds() {
      const uid = await getUserId()
      if (!uid) return
      setUserId(uid)
      
      const { data } = await supabase
        .from('talent_profiles')
        .select('id')
        .eq('id', uid)
        .maybeSingle()
      
      if (data) setTalentProfileId(data.id)
    }
    loadProfileIds()
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ensure we have an intro video preview URL even if it was previously saved (without opening the picker modal).
  useEffect(() => {
    let cancelled = false
    async function loadIntroPreview() {
      const id = typeof portfolio.introVideoId === 'number' ? portfolio.introVideoId : null
      if (!id) {
        if (!cancelled) setIntroPreviewUrl(null)
        return
      }
      if (introPreviewUrl) return
      const uid = await getUserId()
      if (!uid) return
      const row = await supabase
        .from('talent_bank_items')
        .select('id,file_path,title,file_type')
        .eq('user_id', uid)
        .eq('id', id)
        .maybeSingle()
      const filePath = (row.data as any)?.file_path as string | null
      if (!filePath) return
      const { data: urlData } = await supabase.storage.from('talent-bank').createSignedUrl(filePath, 60 * 30)
      if (!cancelled) setIntroPreviewUrl(urlData?.signedUrl ?? null)
    }
    loadIntroPreview().catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.introVideoId])

  // Load Family and Community images
  useEffect(() => {
    let cancelled = false
    async function loadFamilyCommunityImages() {
      const imageIds = Array.isArray(portfolio.family_community?.imageIds) ? portfolio.family_community.imageIds : []
      if (!imageIds.length) return
      
      // Check which items are missing from cache
      const missing: number[] = []
      for (const id of imageIds) {
        if (!tbItemCache[id]) {
          missing.push(id)
        }
      }
      if (!missing.length) return
      
      const uid = await getUserId()
      if (!uid || cancelled) return
      
      const { data } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .in('id', missing)
      
      if (cancelled) return
      
      if (data) {
        const next: Record<number, TalentBankItem> = {}
        for (const item of data) {
          next[item.id] = item as any
          // Load signed URL for images
          if (item.file_path && (item.file_type?.startsWith('image') || item.item_type === 'image')) {
            ensureSignedUrl(item.file_path).catch(() => {})
          }
        }
        setTbItemCache((prev) => ({ ...prev, ...next }))
      }
    }
    loadFamilyCommunityImages()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.family_community?.imageIds?.join(',')])

  function LivePreview() {
    const order = Array.isArray(portfolio.sectionOrder) ? portfolio.sectionOrder : [...DEFAULT_SECTION_ORDER]
    const social = Array.isArray(portfolio.socialLinks) ? portfolio.socialLinks.filter((s) => (s?.url || '').trim()) : []

    const [bioExpanded, setBioExpanded] = useState(false)
    const [skillsExpanded, setSkillsExpanded] = useState(false)
    const [expListExpanded, setExpListExpanded] = useState(false)
    const [eduListExpanded, setEduListExpanded] = useState(false)
    const [projListExpanded, setProjListExpanded] = useState(false)
    const [refListExpanded, setRefListExpanded] = useState(false)
    const [expExpanded, setExpExpanded] = useState<Record<number, boolean>>({})
    const [eduExpanded, setEduExpanded] = useState<Record<number, boolean>>({})
    const [projExpanded, setProjExpanded] = useState<Record<number, boolean>>({})
    const [refExpanded, setRefExpanded] = useState<Record<number, boolean>>({})

    const clampStyle = (lines = 5) => ({
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical' as const,
      WebkitLineClamp: lines,
      overflow: 'hidden',
    })

    const normalizeDisplayText = (s: string) =>
      String(s || '')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    const openSocial = (url: string) => {
      const u = String(url || '').trim()
      if (!u) return
      const href = /^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, '')}`
      window.open(href, '_blank')
    }

    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
          <div className="h-44 md:h-56 bg-slate-900 relative">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.25),transparent_45%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end gap-5">
              <div className="-mt-16 md:-mt-20 shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl">
                      {(portfolio.name || 'T').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold truncate">{portfolio.name || 'Your Name'}</h1>
                  <p className="text-slate-300 mt-1">{portfolio.title || 'Your Title'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <div className="text-slate-300 whitespace-pre-wrap" style={bioExpanded ? undefined : clampStyle(5)}>
                {normalizeDisplayText(portfolio.bio) || 'Add a short bio…'}
              </div>
              {normalizeDisplayText(portfolio.bio).length > 0 ? (
                <button
                  type="button"
                  className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                  onClick={() => setBioExpanded((v) => !v)}
                >
                  {bioExpanded ? 'Show less' : 'Show more'}
                </button>
              ) : null}
            </section>

            {introPreviewUrl ? (
              <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                <h2 className="text-xl font-semibold mb-4">Introduction Video</h2>
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-3xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <div className="rounded-3xl overflow-hidden bg-slate-950/60 border border-white/10">
                      <div className="bg-black">
                        <video src={introPreviewUrl} controls playsInline className="w-full max-h-[280px] object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {order.map((k) => {
              if (k === 'intro' || k === 'social') return null
              // Projects is intentionally rendered in the right column under "Connect With Me"
              if (k === 'projects') return null
              if (k === 'skills') {
                const collapsed = (portfolio.skills || []).slice(0, 20)
                const show = skillsExpanded ? (portfolio.skills || []) : collapsed
                return (
                  <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <h2 className="text-xl font-semibold mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {show.map((s, idx) => (
                        <span key={`${s}-${idx}`} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-sm">
                          {s}
                        </span>
                      ))}
                      {!portfolio.skills?.length ? <div className="text-slate-400 text-sm">No skills yet.</div> : null}
                    </div>
                    {(portfolio.skills || []).length > collapsed.length ? (
                      <button
                        type="button"
                        className="mt-3 text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setSkillsExpanded((v) => !v)}
                      >
                        {skillsExpanded ? 'Show less' : 'Show more'}
                      </button>
                    ) : null}
                  </section>
                )
              }
              if (k === 'experience') {
                const list = expListExpanded ? (portfolio.experience || []) : (portfolio.experience || []).slice(0, 2)
                return (
                  <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <h2 className="text-xl font-semibold mb-4">Experience</h2>
                    {list.map((e, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 mb-3">
                        <div className="font-semibold">{e.title || 'Role'}</div>
                        <div className="text-slate-300 text-sm mt-1">{e.company || 'Company'}</div>
                        {normalizeDisplayText(e.description || '') ? (
                          <div className="mt-3">
                            <div className="text-slate-300 text-sm whitespace-pre-wrap" style={expExpanded[idx] ? undefined : clampStyle(5)}>
                              {normalizeDisplayText(e.description || '')}
                            </div>
                            <button
                              type="button"
                              className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                              onClick={() => setExpExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
                            >
                              {expExpanded[idx] ? 'Show less' : 'Show more'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {!portfolio.experience?.length ? <div className="text-slate-400 text-sm">No experience yet.</div> : null}
                    {(portfolio.experience || []).length > 2 ? (
                      <button
                        type="button"
                        className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setExpListExpanded((v) => !v)}
                      >
                        {expListExpanded ? 'Show fewer roles' : 'Show all roles'}
                      </button>
                    ) : null}
                  </section>
                )
              }
              if (k === 'education') {
                const list = eduListExpanded ? (portfolio.education || []) : (portfolio.education || []).slice(0, 2)
                return (
                  <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <h2 className="text-xl font-semibold mb-4">Education</h2>
                    {list.map((e, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 mb-3">
                        <div className="font-semibold">{e.degree || 'Qualification'}</div>
                        <div className="text-slate-300 text-sm mt-1">{e.institution || 'Institution'}</div>
                        {normalizeDisplayText(String((e as any)?.notes || '')) ? (
                          <div className="mt-3">
                            <div className="text-slate-300 text-sm whitespace-pre-wrap" style={eduExpanded[idx] ? undefined : clampStyle(5)}>
                              {normalizeDisplayText(String((e as any)?.notes || ''))}
                            </div>
                            <button
                              type="button"
                              className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                              onClick={() => setEduExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
                            >
                              {eduExpanded[idx] ? 'Show less' : 'Show more'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {!portfolio.education?.length ? <div className="text-slate-400 text-sm">No education yet.</div> : null}
                    {(portfolio.education || []).length > 2 ? (
                      <button
                        type="button"
                        className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setEduListExpanded((v) => !v)}
                      >
                        {eduListExpanded ? 'Show fewer entries' : 'Show all education'}
                      </button>
                    ) : null}
                  </section>
                )
              }
              if (k === 'attachments') {
                return (
                  <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                    {Array.isArray(portfolio.attachments) && portfolio.attachments.length ? (
                      <div className="space-y-2">
                        {portfolio.attachments.slice(0, 6).map((a) => (
                          <div key={a.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-slate-200 truncate">{a.title}</div>
                              <div className="text-xs text-slate-400 truncate">{a.item_type}</div>
                            </div>
                            {a.file_path ? (
                              <button type="button" className="text-xs text-blue-300 underline" onClick={() => openFilePath(a.file_path!)}>
                                Open
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">No attachments yet.</div>
                    )}
                  </section>
                )
              }
              if (k === 'referees') {
                const list = refListExpanded ? (portfolio.referees || []) : (portfolio.referees || []).slice(0, 2)
                return (
                  <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <h2 className="text-xl font-semibold mb-4">Referees</h2>
                    {list.length ? (
                      <div className="space-y-3">
                        {list.map((r, idx) => (
                          <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="font-semibold">{r.name || 'Referee'}</div>
                            <div className="text-slate-300 text-sm mt-1">
                              {(r.title ? `${r.title} • ` : '') + (r.company ? `${r.company} • ` : '') + (r.relationship ? r.relationship : '')}
                            </div>
                            {normalizeDisplayText(r.notes || '') ? (
                              <div className="mt-3">
                                <div className="text-slate-300 text-sm whitespace-pre-wrap" style={refExpanded[idx] ? undefined : clampStyle(5)}>
                                  {normalizeDisplayText(r.notes || '')}
                                </div>
                                <button
                                  type="button"
                                  className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                  onClick={() => setRefExpanded((p) => ({ ...p, [idx]: !p[idx] }))}
                                >
                                  {refExpanded[idx] ? 'Show less' : 'Show more'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm">No referees yet.</div>
                    )}
                    {(portfolio.referees || []).length > 2 ? (
                      <button
                        type="button"
                        className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setRefListExpanded((v) => !v)}
                      >
                        {refListExpanded ? 'Show fewer referees' : 'Show all referees'}
                      </button>
                    ) : null}
                  </section>
                )
              }
              return null
            })}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="text-slate-200 font-semibold mb-4">Connect With Me</div>
              {social.length ? (
                <div className="space-y-2">
                  {social.slice(0, 8).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                      onClick={() => openSocial(String(s.url))}
                    >
                      <div className="text-sm font-semibold text-slate-200">{String(s.platform)}</div>
                      <div className="text-xs text-slate-400 break-all">{String(s.url)}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No social links yet.</div>
              )}
            </div>

            {/* Projects under Connect With Me (to fill the right column beside Intro Video) */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-200 font-semibold">Projects</div>
                {(portfolio.projects || []).length > 2 ? (
                  <button
                    type="button"
                    className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                    onClick={() => setProjListExpanded((v) => !v)}
                  >
                    {projListExpanded ? 'Show less' : 'Show all'}
                  </button>
                ) : null}
              </div>

              {(portfolio.projects || []).length ? (
                <div className="space-y-3">
                  {(projListExpanded ? (portfolio.projects || []) : (portfolio.projects || []).slice(0, 2)).map((p, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <div className="font-semibold">{p.name || 'Project'}</div>
                      {p.url ? (
                        <div className="text-blue-300 text-sm mt-1 break-all">{p.url}</div>
                      ) : null}
                      {normalizeDisplayText(p.description || '') ? (
                        <div className="mt-3">
                          <div className="text-slate-300 text-sm whitespace-pre-wrap" style={projExpanded[idx] ? undefined : clampStyle(5)}>
                            {normalizeDisplayText(p.description || '')}
                          </div>
                          <button
                            type="button"
                            className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setProjExpanded((q) => ({ ...q, [idx]: !q[idx] }))}
                          >
                            {projExpanded[idx] ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                      ) : null}

                      {Array.isArray((p as any)?.attachmentIds) && (p as any).attachmentIds.length ? (
                        <div className="mt-4">
                          <div className="text-xs text-slate-400 mb-2">
                            Attached files: <span className="text-slate-200 font-semibold">{(p as any).attachmentIds.length}</span>
                          </div>
                          <div className="space-y-2">
                            {(p as any).attachmentIds.slice(0, 3).map((id: any) => (
                              <ProjectAttachmentChip key={id} id={Number(id)} onRemove={() => {}} />
                            ))}
                            {(p as any).attachmentIds.length > 3 ? (
                              <div className="text-xs text-slate-400 px-1">+{(p as any).attachmentIds.length - 3} more…</div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No projects yet.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    )
  }

  async function log(message: string, hypothesisId: string, data: any) {
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run-portfolio',
        hypothesisId,
        location: 'src/components/PortfolioEditor.tsx',
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }

  async function getUserId() {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  }

  const anySectionEditing = useMemo(() => Object.values(sectionEdit).some(Boolean), [sectionEdit])

  async function ensureUsersRow(userId: string): Promise<boolean> {
    // Talent Bank schema FK requires public.users(id) exist with a non-null role.
    // This function attempts to create/upsert a row in public.users for the current user.
    try {
      const isMissingColErr = (err: any) => {
        const msg = String(err?.message ?? '')
        const code = String(err?.code ?? '')
        return code === 'PGRST204' || /Could not find the .* column/i.test(msg)
      }

      // Determine which self column exists (id vs user_id) with minimal noise.
      let selfCol: 'id' | 'user_id' = 'id'
      const checkId = await supabase.from('users').select('id').eq('id', userId).maybeSingle()
      if (checkId.error && isMissingColErr(checkId.error)) {
        selfCol = 'user_id'
      } else if (!checkId.error && checkId.data) {
        return true
      }

      if (selfCol === 'user_id') {
        const checkUserId = await supabase.from('users').select('user_id').eq('user_id', userId).maybeSingle()
        if (!checkUserId.error && checkUserId.data) return true
      }

      // Get user email from auth session for the insert
      const { data: sessionData } = await supabase.auth.getSession()
      const userEmail = sessionData?.session?.user?.email || ''
      
      // Try INSERT first (more likely to work with RLS), then UPDATE if it already exists
      if (selfCol === 'id') {
        // Try INSERT first with email and role (role is required NOT NULL)
        const insertRes = await supabase.from('users').insert({ id: userId, email: userEmail, role: 'talent' } as any)
        if (!insertRes.error) return true
        
        // If insert fails due to conflict, try UPDATE
        if (insertRes.error && (insertRes.error as any)?.code === '23505') {
          const updateRes = await supabase.from('users').update({ id: userId } as any).eq('id', userId)
          if (!updateRes.error) return true
        }
        
        // If column doesn't exist, try user_id
        if (isMissingColErr(insertRes.error)) {
          const r2 = await supabase.from('users').insert({ user_id: userId, email: userEmail, role: 'talent' } as any)
          if (!r2.error) return true
          if (r2.error && (r2.error as any)?.code === '23505') {
            const updateRes2 = await supabase.from('users').update({ user_id: userId } as any).eq('user_id', userId)
            if (!updateRes2.error) return true
          }
        }
      } else {
        // Try INSERT first with user_id, email, and role
        const insertRes = await supabase.from('users').insert({ user_id: userId, email: userEmail, role: 'talent' } as any)
        if (!insertRes.error) return true
        
        // If insert fails due to conflict, try UPDATE
        if (insertRes.error && (insertRes.error as any)?.code === '23505') {
          const updateRes = await supabase.from('users').update({ user_id: userId } as any).eq('user_id', userId)
          if (!updateRes.error) return true
        }
        
        // If column doesn't exist, try id
        if (isMissingColErr(insertRes.error)) {
          const r2 = await supabase.from('users').insert({ id: userId, email: userEmail, role: 'talent' } as any)
          if (!r2.error) return true
          if (r2.error && (r2.error as any)?.code === '23505') {
            const updateRes2 = await supabase.from('users').update({ id: userId } as any).eq('id', userId)
            if (!updateRes2.error) return true
          }
        }
      }
      
      // If all attempts failed, check if it's an RLS issue
      const lastError = await supabase.from('users').select('id').eq('id', userId).maybeSingle()
      if (lastError.error) {
        const errorMsg = String((lastError.error as any)?.message ?? '')
        if (errorMsg.includes('policy') || errorMsg.includes('RLS') || errorMsg.includes('row-level security')) {
          console.error('RLS policy issue: Migration 2025122208_users_self_row.sql may not have been run')
          return false
        }
      }
      
      return false
    } catch (error) {
      console.error('ensureUsersRow exception:', error)
      return false
    }
  }

  function fileExt(title: string) {
    const m = title.toLowerCase().match(/\.([a-z0-9]+)$/)
    return m?.[1] ?? ''
  }

  async function ensureSignedUrl(path: string) {
    if (!path) return
    if (thumbUrls[path]) return
    const { data } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
    if (data?.signedUrl) setThumbUrls((prev) => ({ ...prev, [path]: data.signedUrl }))
  }

  function moveSection(from: number, to: number) {
    setPortfolio((prev) => {
      const order = Array.isArray(prev.sectionOrder) ? [...prev.sectionOrder] : [...DEFAULT_SECTION_ORDER]
      if (from < 0 || from >= order.length || to < 0 || to >= order.length) return prev
      const [moved] = order.splice(from, 1)
      order.splice(to, 0, moved)
      // #region agent log
      log('layout order changed', 'P_LAYOUT', { from, to, order }).catch(() => {})
      // #endregion agent log
      return { ...prev, sectionOrder: order }
    })
  }

  async function ensureMediaUrl(kind: 'avatar' | 'banner', path: string | null | undefined) {
    if (!path) return
    const { data, error } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
    await log('createSignedUrl media', 'P_MEDIA', {
      kind,
      hasError: !!error,
      errorMessage: (error as any)?.message ?? null,
      hasUrl: !!data?.signedUrl,
    })
    if (data?.signedUrl) {
      if (kind === 'avatar') setAvatarUrl(data.signedUrl)
      if (kind === 'banner') setBannerUrl(data.signedUrl)
    }
  }

  async function openFilePath(path: string) {
    const { data } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function ensureTbItem(id: number) {
    if (!id) return
    if (tbItemCache[id]) return
    const uid = await getUserId()
    if (!uid) return
    const { data } = await supabase
      .from('talent_bank_items')
      .select('id,item_type,title,metadata,file_path,file_type,created_at')
      .eq('user_id', uid)
      .eq('id', id)
      .maybeSingle()
    if (data?.id) {
      setTbItemCache((prev) => ({ ...prev, [id]: data as any }))
    }
  }

  function ThumbIcon({ label }: { label: string }) {
    return (
      <div className="w-[20mm] h-[20mm] rounded-lg border border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
        <div className="px-2 py-1 rounded border border-gray-200 bg-white text-[10px] font-semibold text-gray-700">
          {label}
        </div>
      </div>
    )
  }

  function MetaThumb({ kind, title }: { kind: string; title: string }) {
    const k = String(kind || '').toLowerCase()
    const badge =
      k === 'experience' ? 'EXP' :
      k === 'education' ? 'EDU' :
      k === 'credential' ? 'CERT' :
      k === 'social' ? 'SOC' :
      k === 'project' ? 'PROJ' :
      'ITEM'
    const icon =
      k === 'experience' ? '💼' :
      k === 'education' ? '🎓' :
      k === 'credential' ? '🏅' :
      k === 'social' ? '🔗' :
      k === 'project' ? '🧩' :
      '📄'

    return (
      <div className="w-[20mm] h-[20mm] rounded-lg border border-gray-300 bg-gradient-to-br from-gray-50 to-white overflow-hidden flex items-center justify-center shrink-0">
        <div className="text-center px-2">
          <div className="text-lg leading-none">{icon}</div>
          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-semibold text-gray-700">
            {badge}
          </div>
          <div className="mt-1 text-[9px] text-gray-500 truncate max-w-[18mm]">{String(title || '').slice(0, 18)}</div>
        </div>
      </div>
    )
  }

  function PdfThumb({ url, title, onClick }: { url: string; title: string; onClick: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
      let cancelled = false
      async function render() {
        try {
          setErr(null)
          const pdfjsLib: any = await loadPdfJsLib()

          const loadingTask = pdfjsLib.getDocument({ url })
          const pdf = await loadingTask.promise
          const page = await pdf.getPage(1)

          const canvas = canvasRef.current
          if (!canvas || cancelled) return
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const baseViewport = page.getViewport({ scale: 1 })
          const targetPx = 90 // roughly fits 20mm thumbnail
          const scale = targetPx / baseViewport.width
          const viewport = page.getViewport({ scale })

          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)

          await page.render({ canvasContext: ctx, viewport }).promise
        } catch (e: any) {
          if (!cancelled) setErr(e?.message ?? String(e))
        }
      }
      render()
      return () => {
        cancelled = true
      }
    }, [url])

    return (
      <button
        type="button"
        className="w-[20mm] h-[20mm] rounded-lg border border-gray-300 overflow-hidden bg-white shrink-0"
        onClick={onClick}
        title={title || 'Open PDF'}
      >
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          {err ? (
            <div className="text-[9px] text-gray-500">PDF</div>
          ) : (
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          )}
        </div>
      </button>
    )
  }

  function renderAttachmentThumb(a: PortfolioData['attachments'][number]) {
    const isImg = a.file_type?.startsWith('image') || a.item_type === 'image'
    const isVid = a.file_type?.startsWith('video') || a.item_type === 'video'
    const ext = fileExt(a.title)
    const label = isImg ? 'IMG' : isVid ? 'VID' : ext ? ext.toUpperCase().slice(0, 4) : 'FILE'

    if (a.file_path && (isImg || isVid)) {
      if (!a.url) ensureSignedUrl(a.file_path).catch(() => {})
      const url = a.url || thumbUrls[a.file_path]

      if (url && isImg) {
        return (
          <button
            type="button"
            className="w-[20mm] h-[20mm] rounded-lg border border-gray-300 overflow-hidden"
            onClick={() => setPreview({ kind: 'image', url, title: a.title })}
            title="Click to expand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={a.title} className="w-full h-full object-cover" />
          </button>
        )
      }

      if (url && isVid) {
        return (
          <button
            type="button"
            className="w-[20mm] h-[20mm] rounded-lg border border-gray-300 overflow-hidden"
            onClick={() => setPreview({ kind: 'video', url, title: a.title })}
            title="Click to expand"
          >
            <div className="relative w-full h-full">
              <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold bg-black/30 text-white">
                ▶
              </div>
            </div>
          </button>
        )
      }
    }

    return <ThumbIcon label={label} />
  }

  function renderImportThumb(item: TalentBankItem) {
    const isImg = item.file_type?.startsWith('image') || item.item_type === 'image'
    const isVid = item.file_type?.startsWith('video') || item.item_type === 'video'
    const isPdf = item.file_type?.includes('pdf') || fileExt(item.title) === 'pdf'
    const ext = fileExt(item.title)
    const label = isImg ? 'IMG' : isVid ? 'VID' : ext ? ext.toUpperCase().slice(0, 4) : 'FILE'

    const path = item.file_path || ''
    if (path && (isImg || isVid || isPdf) && !thumbUrls[path]) {
      ensureSignedUrl(path).catch(() => {})
    }
    const url = path ? thumbUrls[path] : null

    const base = 'w-[20mm] h-[20mm] rounded-lg border border-gray-300 overflow-hidden flex items-center justify-center shrink-0 bg-gray-50'

    if (url && isImg) {
      return (
        <button type="button" className={base} onClick={() => setPreview({ kind: 'image', url, title: item.title })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={item.title} className="w-full h-full object-cover" />
        </button>
      )
    }

    if (url && isVid) {
      return (
        <button type="button" className={base} onClick={() => setPreview({ kind: 'video', url, title: item.title })}>
          <div className="relative w-full h-full">
            <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold bg-black/30 text-white">▶</div>
          </div>
        </button>
      )
    }

    if (url && isPdf) {
      return <PdfThumb url={url} title={item.title} onClick={() => openFilePath(path)} />
    }

    // Structured items without files: show a clear card thumbnail.
    if (!path && (item.item_type === 'experience' || item.item_type === 'education' || item.item_type === 'credential' || item.item_type === 'social' || item.item_type === 'project')) {
      return <MetaThumb kind={item.item_type} title={item.title} />
    }

    // Documents/other: icon thumbnail; clicking opens the file if available.
    if (path) {
      return (
        <button type="button" className={base} onClick={() => openFilePath(path)}>
          <div className="px-2 py-1 rounded border border-gray-200 bg-white text-[10px] font-semibold text-gray-700">
            {label}
          </div>
        </button>
      )
    }

    return (
      <div className={base}>
        <div className="px-2 py-1 rounded border border-gray-200 bg-white text-[10px] font-semibold text-gray-700">
          {label}
        </div>
      </div>
    )
  }

  function DocumentAttachmentChip({ id, onRemove }: { id: number; onRemove: () => void }) {
    const item = tbItemCache[id]

    useEffect(() => {
      if (!item) ensureTbItem(id).catch(() => {})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
      if (item?.file_path && !thumbUrls[item.file_path]) {
        ensureSignedUrl(item.file_path).catch(() => {})
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.file_path])

    if (!item) {
      return (
        <div className="w-[15mm] h-[15mm] rounded-lg border border-white/10 bg-slate-900/30 flex items-center justify-center">
          <div className="text-xs text-slate-400">…</div>
        </div>
      )
    }

    const open = () => {
      if (item.file_path) {
        openFilePath(item.file_path).catch(() => {})
        return
      }
      if (item.file_url) {
        window.open(item.file_url, '_blank')
        return
      }
    }

    const isImg = item.file_type?.startsWith('image') || item.item_type === 'image'
    const isVid = item.file_type?.startsWith('video') || item.item_type === 'video'
    const ext = fileExt(item.title)
    const label = isImg ? 'IMG' : isVid ? 'VID' : ext ? ext.toUpperCase().slice(0, 4) : 'FILE'
    const url = item.file_path ? thumbUrls[item.file_path] : null

    return (
      <div className="relative group">
        <button
          type="button"
          onClick={open}
          className="w-[15mm] h-[15mm] rounded-lg border border-white/10 bg-slate-900/30 overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors"
          title={item.title}
        >
          {url && isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={item.title} className="w-full h-full object-cover" />
          ) : url && isVid ? (
            <div className="relative w-full h-full">
              <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold bg-black/30 text-white">
                ▶
              </div>
            </div>
          ) : (
            <ThumbIcon label={label} />
          )}
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
    )
  }

  function ProjectAttachmentChip({ id, onRemove }: { id: number; onRemove: () => void }) {
    const item = tbItemCache[id]

    useEffect(() => {
      if (!item) ensureTbItem(id).catch(() => {})
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    useEffect(() => {
      if (item?.file_path && !thumbUrls[item.file_path]) {
        ensureSignedUrl(item.file_path).catch(() => {})
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.file_path])

    if (!item) {
      return (
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg border border-white/10 bg-slate-900/30">
          <ThumbIcon label="…" />
          <div className="text-xs text-slate-400">Loading…</div>
        </div>
      )
    }

    const open = () => {
      if (item.file_path) {
        openFilePath(item.file_path).catch(() => {})
        return
      }
      if (item.item_type === 'social') {
        const u = (item.metadata as any)?.url ?? ''
        if (u) window.open(String(u).startsWith('http') ? String(u) : `https://${u}`, '_blank')
      }
    }

    return (
      <div className="flex items-center gap-3 px-2 py-2 rounded-xl border border-white/10 bg-slate-900/30">
        {renderImportThumb(item)}
        <div className="min-w-0">
          <div className="text-sm text-slate-200 truncate">{item.title}</div>
          <div className="text-xs text-slate-400 truncate">{item.item_type}</div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <button type="button" className="text-blue-300 underline" onClick={open}>
              Open
            </button>
            <button type="button" className="text-red-300 underline" onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>
      </div>
    )
  }

  function toTenWords(s: string) {
    const words = String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
    if (words.length <= 10) return words.join(' ')
    return words.slice(0, 10).join(' ') + '…'
  }

  function itemSummary(item: TalentBankItem) {
    const t = String(item.item_type || '').toLowerCase()
    const m: any = item.metadata ?? {}
    if (t === 'experience') {
      const role = m?.title || m?.role || ''
      const company = m?.company || ''
      const desc = m?.description || m?.summary || ''
      return toTenWords([role, company, desc].filter(Boolean).join(' — '))
    }
    if (t === 'education') {
      const inst = m?.institution || ''
      const degree = m?.degree || m?.course || ''
      const year = m?.year || m?.endDate || ''
      return toTenWords([inst, degree, year].filter(Boolean).join(' — '))
    }
    if (t === 'credential' || t === 'certification' || t === 'license') {
      const name = m?.name || item.title || ''
      const issuer = m?.issuer || ''
      const expiry = m?.expiry || ''
      return toTenWords([name, issuer, expiry].filter(Boolean).join(' — '))
    }
    if (t === 'social') {
      const platform = m?.platform || ''
      const url = m?.url || ''
      return toTenWords([platform, url].filter(Boolean).join(' '))
    }
    if (t === 'project') {
      const name = m?.name || item.title || ''
      const desc = m?.description || ''
      return toTenWords([name, desc].filter(Boolean).join(' — '))
    }
    if (t === 'referee' || t === 'referees' || t === 'reference') {
      const name = m?.name || item.title || ''
      const rel = m?.relationship || ''
      const company = m?.company || ''
      return toTenWords([name, rel, company].filter(Boolean).join(' — '))
    }
    const content = m?.description || m?.notes || item.title || ''
    return toTenWords(String(content))
  }

  async function loadSavedPortfolio() {
    try {
      const uid = await getUserId()
      await log('loadSavedPortfolio start', 'P_LOAD', { hasUser: !!uid })
      if (!uid) return

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id, metadata')
        .eq('user_id', uid)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)

      await log('loadSavedPortfolio result', 'P_LOAD', { hasError: !!error, rowCount: data?.length ?? 0 })
      if (error) return

      const saved = data?.[0]?.metadata
      if (saved && typeof saved === 'object') {
        // Load selected template ID from saved portfolio
        if ((saved as any).selected_template_id) {
          setSelectedTemplateId((saved as any).selected_template_id)
        }
        
        setPortfolio((prev) => {
          // migrate older portfolios by appending missing sections (e.g., referees, social)
          const savedOrder = Array.isArray((saved as any).sectionOrder) ? (saved as any).sectionOrder.map((x: any) => String(x)) : null
          const mergedOrder = savedOrder ? [...savedOrder] : [...(prev.sectionOrder ?? DEFAULT_SECTION_ORDER)]
          for (const k of DEFAULT_SECTION_ORDER) {
            const kk = String(k)
            if (!mergedOrder.includes(kk)) mergedOrder.push(kk)
          }

          return {
            ...prev,
            ...saved,
            // ensure required fields exist
            socialLinks: Array.isArray((saved as any).socialLinks)
              ? (saved as any).socialLinks
                  .map((s: any) => ({ platform: String(s?.platform ?? ''), url: String(s?.url ?? '') }))
                  .filter((s: any) => s.platform.trim() && s.url.trim())
              : prev.socialLinks,
            skills: Array.isArray(saved.skills) ? saved.skills : prev.skills,
            experience: Array.isArray(saved.experience) ? saved.experience : prev.experience,
            education: Array.isArray(saved.education)
              ? saved.education.map((e: any) => ({
                  institution: e?.institution ?? '',
                  degree: e?.degree ?? '',
                  field: e?.field ?? '',
                  year: e?.year ?? '',
                  attachmentIds: Array.isArray(e?.attachmentIds) ? e.attachmentIds : [],
                }))
              : prev.education,
            referees: Array.isArray(saved.referees)
              ? saved.referees.map((r: any) => ({
                  name: r?.name ?? '',
                  relationship: r?.relationship ?? '',
                  company: r?.company ?? '',
                  title: r?.title ?? '',
                  email: r?.email ?? '',
                  phone: r?.phone ?? '',
                  notes: r?.notes ?? '',
                  attachmentIds: Array.isArray(r?.attachmentIds) ? r.attachmentIds : [],
                }))
              : prev.referees,
            attachments: Array.isArray(saved.attachments) ? saved.attachments : prev.attachments,
            projects: Array.isArray(saved.projects)
              ? saved.projects.map((p: any) => ({
                  name: p?.name ?? '',
                  description: p?.description ?? '',
                  url: p?.url ?? '',
                  attachmentIds: Array.isArray(p?.attachmentIds) ? p.attachmentIds : [],
                }))
              : prev.projects,
            sectionOrder: mergedOrder,
            introVideoId:
              typeof saved.introVideoId === 'number' ? saved.introVideoId : (saved.introVideoId == null ? null : prev.introVideoId),
            family_community: (saved as any).family_community && typeof (saved as any).family_community === 'object'
              ? {
                  imageIds: Array.isArray((saved as any).family_community.imageIds)
                    ? (saved as any).family_community.imageIds.filter((id: any) => typeof id === 'number' && id > 0)
                    : [],
                  descriptions: typeof (saved as any).family_community.descriptions === 'object' && (saved as any).family_community.descriptions !== null
                    ? (saved as any).family_community.descriptions
                    : {}
                }
              : prev.family_community,
          }
        })
      }

      await ensureMediaUrl('avatar', (saved as any)?.avatar_path)
      await ensureMediaUrl('banner', (saved as any)?.banner_path)

      // Also load portfolioSelections (set in Talent Bank) and render as attachments automatically.
      const selections: number[] = Array.isArray(saved?.portfolioSelections) ? saved.portfolioSelections : []
      if (selections.length) {
        const { data: selItems, error: selErr } = await supabase
          .from('talent_bank_items')
          .select('id,item_type,title,file_path,file_type')
          .eq('user_id', uid)
          .in('id', selections)

        await log('load portfolioSelections', 'P_LOAD', {
          hasError: !!selErr,
          selectedCount: selections.length,
          rowCount: Array.isArray(selItems) ? selItems.length : 0,
        })

        if (!selErr && Array.isArray(selItems)) {
          const attachments: any[] = []
          for (const it of selItems) {
            if (!it.file_path) continue
            const { data: urlData } = await supabase.storage.from('talent-bank').createSignedUrl(it.file_path, 60 * 30)
            attachments.push({
              id: it.id,
              title: it.title,
              item_type: it.item_type,
              file_path: it.file_path,
              file_type: it.file_type ?? null,
              url: urlData?.signedUrl ?? null,
            })
          }
          setPortfolio((prev) => ({ ...prev, attachments }))
        }
      }
    } catch (e: any) {
      await log('loadSavedPortfolio exception', 'P_LOAD', { message: e?.message ?? String(e) })
    }
  }

  async function uploadPortfolioImage(kind: 'avatar' | 'banner', file: File) {
    const uid = await getUserId()
    await log('uploadPortfolioImage start', 'P_MEDIA', { kind, hasUser: !!uid, fileType: file.type, fileSize: file.size })
    if (!uid) {
      alert('Please sign in to upload images.')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.')
      return
    }
    const maxBytes = 10 * 1024 * 1024
    if (file.size > maxBytes) {
      alert('Image is too large. Please use an image under 10MB.')
      return
    }

    const path = `${uid}/portfolio/${kind}-${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from('talent-bank').upload(path, file, { upsert: true, contentType: file.type })
    await log('uploadPortfolioImage result', 'P_MEDIA', {
      kind,
      hasError: !!error,
      errorMessage: (error as any)?.message ?? null,
    })
    if (error) {
      alert((error as any)?.message ?? 'Upload failed')
      return
    }

    setPortfolio((prev) => ({ ...prev, [`${kind}_path`]: path } as any))
    await ensureMediaUrl(kind, path)
  }

  async function openImportModal() {
    setImportOpen(true)
      setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      await log('import modal open', 'P_IMPORT', { hasUser: !!uid })
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      await log('fetch talent_bank_items', 'P_IMPORT', {
        hasError: !!error,
        rowCount: Array.isArray(data) ? data.length : 0,
        errorMessage: (error as any)?.message ?? null,
      })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      setAvailableItems((data ?? []).filter((i: any) => i.item_type !== 'portfolio'))
      setSelectedIds({})
    } finally {
      setIsImporting(false)
    }
  }

  async function applyImport() {
    try {
      const selected = availableItems.filter((i) => selectedIds[i.id])
      await log('apply import', 'P_IMPORT_APPLY', { selectedCount: selected.length })
      if (!selected.length) {
        setImportOpen(false)
        return
      }

      // Build attachments (for any item that has a file_path)
      const attachmentsToAdd: PortfolioData['attachments'] = []
      for (const item of selected) {
        if (!item.file_path) continue
        const { data, error } = await supabase.storage.from('talent-bank').createSignedUrl(item.file_path, 60 * 30)
        await log('createSignedUrl for attachment', 'P_IMPORT', {
          hasError: !!error,
          errorMessage: (error as any)?.message ?? null,
          itemId: item.id,
          itemType: item.item_type,
          hasUrl: !!data?.signedUrl,
        })
        attachmentsToAdd.push({
          id: item.id,
          title: item.title,
          item_type: item.item_type,
          file_path: item.file_path ?? null,
          file_type: item.file_type ?? null,
          url: data?.signedUrl ?? null,
        })
      }

      const mappedExperience = selected
        .filter((i) => i.item_type === 'experience')
        .map((item) => ({
        company: item.metadata?.company || item.title,
        title: item.metadata?.title || '',
        startDate: item.metadata?.startDate || '',
        endDate: item.metadata?.endDate || '',
          description: item.metadata?.description || item.metadata?.summary || '',
      }))

      const mappedEducation = selected
        .filter((i) => i.item_type === 'education')
        .map((item) => ({
        institution: item.metadata?.institution || item.title,
        degree: item.metadata?.degree || '',
        field: item.metadata?.field || '',
        year:
          item.metadata?.year ||
          item.metadata?.endDate ||
          item.metadata?.completionYear ||
            '',
      }))

      const mappedProjects = selected
        .filter((i) => i.item_type === 'project')
        .map((item) => ({
          name: String(item.metadata?.name || item.title || '').trim() || 'Project',
          description: String(item.metadata?.description || item.metadata?.summary || '').trim(),
          url: String(item.metadata?.url || item.metadata?.link || '').trim(),
          attachmentIds: Array.isArray(item.metadata?.attachmentIds) ? item.metadata.attachmentIds : [],
        }))
        .filter((p) => p.name)

      setPortfolio((prev) => ({
        ...prev,
        experience: mappedExperience.length ? [...prev.experience, ...mappedExperience] : prev.experience,
        education: mappedEducation.length ? [...prev.education, ...mappedEducation] : prev.education,
        projects: mappedProjects.length
          ? (() => {
              const existing = Array.isArray(prev.projects) ? prev.projects : []
              const next = [...existing]
              for (const p of mappedProjects) {
                const url = String(p.url || '').trim()
                if (url && next.some((x) => String(x?.url || '').trim().toLowerCase() === url.toLowerCase())) continue
                next.push(p)
              }
              return next
            })()
          : prev.projects,
        attachments: attachmentsToAdd.length ? [...prev.attachments, ...attachmentsToAdd] : prev.attachments,
      }))

      setImportOpen(false)
    } catch (e: any) {
      await log('applyImport exception', 'P_IMPORT_APPLY', { message: e?.message ?? String(e) })
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  const addSkill = () => {
    if (!sectionEdit.skills) return
    if (newSkill.trim()) {
      setPortfolio({
        ...portfolio,
        skills: [...portfolio.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const removeSkill = (index: number) => {
    if (!sectionEdit.skills) return
    setPortfolio({
      ...portfolio,
      skills: portfolio.skills.filter((_, i) => i !== index)
    })
  }

  const removeExperience = (index: number) => {
    if (!sectionEdit.experience) return
    setPortfolio((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }))
  }

  const addExperience = () => {
    if (!sectionEdit.experience) return
    setPortfolio({
      ...portfolio,
      experience: [
        ...portfolio.experience,
        { company: '', title: '', startDate: '', endDate: '', description: '' }
      ]
    })
  }

  const updateExperience = (index: number, field: string, value: string) => {
    if (!sectionEdit.experience) return
    setPortfolio((prev) => {
      const updated = [...prev.experience]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, experience: updated }
    })
  }

  const bulkCount = (m: Record<string, boolean>) => Object.values(m).filter(Boolean).length
  const bulkIsAllSelected = (keys: string[], m: Record<string, boolean>) => keys.length > 0 && keys.every((k) => !!m[k])
  const bulkToggleKey = (section: BulkSection, key: string, checked: boolean) => {
    setBulkSel((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: checked },
    }))
  }
  const bulkSetAll = (section: BulkSection, keys: string[], checked: boolean) => {
    setBulkSel((prev) => ({
      ...prev,
      [section]: checked ? Object.fromEntries(keys.map((k) => [k, true])) : {},
    }))
  }
  const bulkClear = (section: BulkSection) => {
    setBulkSel((prev) => ({ ...prev, [section]: {} }))
  }
  const bulkDeleteSelected = (section: BulkSection) => {
    if (!sectionEdit[section]) return
    const sel = bulkSel[section]
    const count = bulkCount(sel)
    if (count === 0) return
    const ok = window.confirm(`Delete ${count} item(s) from ${section}? This cannot be undone.`)
    if (!ok) return

    if (section === 'skills') {
      setPortfolio((p) => ({ ...p, skills: p.skills.filter((_, i) => !sel[String(i)]) }))
    } else if (section === 'experience') {
      setPortfolio((p) => ({ ...p, experience: p.experience.filter((_, i) => !sel[String(i)]) }))
    } else if (section === 'education') {
      setPortfolio((p) => ({ ...p, education: p.education.filter((_, i) => !sel[String(i)]) }))
    } else if (section === 'referees') {
      setPortfolio((p) => ({ ...p, referees: p.referees.filter((_, i) => !sel[String(i)]) }))
    } else if (section === 'attachments') {
      setPortfolio((p) => ({ ...p, attachments: p.attachments.filter((a) => !sel[String(a.id)]) }))
    } else if (section === 'projects') {
      setPortfolio((p) => ({ ...p, projects: p.projects.filter((_, i) => !sel[String(i)]) }))
    } else if (section === 'personal_documents') {
      setPortfolio((p) => ({ ...p, personal_documents: p.personal_documents.filter((_, i) => !sel[String(i)]) }))
    } else if (section === 'licences_accreditations') {
      setPortfolio((p) => ({ ...p, licences_accreditations: p.licences_accreditations.filter((_, i) => !sel[String(i)]) }))
    }

    bulkClear(section)
  }

  const addEducation = () => {
    // Enable edit mode if not already enabled
    if (!sectionEdit.education) {
      setSectionEdit((p) => ({ ...p, education: true }))
    }
    // Add new education entry
    setPortfolio((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', field: '', year: '', attachmentIds: [] }],
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    if (!sectionEdit.education) return
    setPortfolio((prev) => {
      const updated = [...prev.education]
      const current = updated[index]
      if (!current) return prev
      // Explicitly preserve attachmentIds when updating fields
      updated[index] = { 
        ...current, 
        [field]: value,
        attachmentIds: Array.isArray(current.attachmentIds) ? current.attachmentIds : []
      }
      return { ...prev, education: updated }
    })
  }

  const removeEducation = (index: number) => {
    if (!sectionEdit.education) return
    setPortfolio((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))
  }

  const addProject = () => {
    if (!sectionEdit.projects) return
    setPortfolio((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: '', description: '', url: '', attachmentIds: [] }],
    }))
  }

  const updateProject = (index: number, field: string, value: string) => {
    if (!sectionEdit.projects) return
    setPortfolio((prev) => {
      const updated = [...prev.projects]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, projects: updated }
    })
  }

  const removeProject = (index: number) => {
    if (!sectionEdit.projects) return
    setPortfolio((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }))
  }

  // Personal Documents functions
  const addPersonalDocument = () => {
    if (!sectionEdit.personal_documents) return
    setPortfolio((prev) => ({
      ...prev,
      personal_documents: [...prev.personal_documents, { title: '', description: '', attachmentIds: [] }],
    }))
  }

  const updatePersonalDocument = (index: number, field: string, value: string) => {
    if (!sectionEdit.personal_documents) return
    setPortfolio((prev) => {
      const updated = [...prev.personal_documents]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, personal_documents: updated }
    })
  }

  const removePersonalDocument = (index: number) => {
    if (!sectionEdit.personal_documents) return
    setPortfolio((prev) => ({ ...prev, personal_documents: prev.personal_documents.filter((_, i) => i !== index) }))
  }

  // Licences and Accreditations functions
  const addLicence = () => {
    if (!sectionEdit.licences_accreditations) return
    setPortfolio((prev) => {
      const newIndex = prev.licences_accreditations.length
      return {
        ...prev,
        licences_accreditations: [...prev.licences_accreditations, { title: '', description: '', issueDate: '', expiryDate: '', issuer: '', attachmentIds: [] }],
      }
    })
  }

  const updateLicence = (index: number, field: string, value: string) => {
    if (!sectionEdit.licences_accreditations) return
    setPortfolio((prev) => {
      const updated = [...prev.licences_accreditations]
      updated[index] = { ...updated[index], [field]: value }
      
      // If title changed, clear issuer suggestions and selected title
      if (field === 'title') {
        setLicenceIssuerSuggestions(prev => ({ ...prev, [index]: [] }))
        setSelectedTitleIndex(prev => {
          const newState = { ...prev }
          delete newState[index]
          return newState
        })
        // If title is cleared, clear issuer too
        if (!value) {
          updated[index].issuer = ''
        }
      }
      
      return { ...prev, licences_accreditations: updated }
    })
  }

  const removeLicence = (index: number) => {
    if (!sectionEdit.licences_accreditations) return
    setPortfolio((prev) => ({ ...prev, licences_accreditations: prev.licences_accreditations.filter((_, i) => i !== index) }))
    // Clean up autocomplete state
    setLicenceTitleSuggestions(prev => {
      const newState = { ...prev }
      delete newState[index]
      return newState
    })
    setLicenceIssuerSuggestions(prev => {
      const newState = { ...prev }
      delete newState[index]
      return newState
    })
    setSelectedTitleIndex(prev => {
      const newState = { ...prev }
      delete newState[index]
      return newState
    })
  }

  // Search licence titles from reference table with debounce
  const searchLicenceTitles = async (index: number, query: string) => {
    // Clear existing timeout for this index
    if (searchTimeoutRef.current[index]) {
      clearTimeout(searchTimeoutRef.current[index])
    }

    if (!query || query.length < 2) {
      setLicenceTitleSuggestions(prev => ({ ...prev, [index]: [] }))
      if (activeTitleAutocompleteIndex === index) {
        setActiveTitleAutocompleteIndex(null)
      }
      return
    }

    // Debounce search by 300ms
    searchTimeoutRef.current[index] = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('licences_accreditations_reference')
          .select('name, jurisdiction, issuing_authority')
          .ilike('name', `%${query}%`)
          .eq('is_active', true)
          .limit(20)
          .order('name', { ascending: true })

        if (error) {
          console.error('[Licence Search] Error:', error)
          setLicenceTitleSuggestions(prev => ({ ...prev, [index]: [] }))
          return
        }

        const suggestions = (data || []).map(item => ({
          name: item.name,
          jurisdiction: item.jurisdiction || '',
          issuing_authority: item.issuing_authority || item.jurisdiction || ''
        }))

        setLicenceTitleSuggestions(prev => ({ ...prev, [index]: suggestions }))
        if (suggestions.length > 0) {
          setActiveTitleAutocompleteIndex(index)
        } else {
          setActiveTitleAutocompleteIndex(null)
        }
      } catch (err) {
        console.error('[Licence Search] Exception:', err)
        setLicenceTitleSuggestions(prev => ({ ...prev, [index]: [] }))
      }
    }, 300)
  }

  // Handle title selection
  const handleTitleSelect = async (index: number, selected: {name: string, jurisdiction: string, issuing_authority?: string}) => {
    if (!sectionEdit.licences_accreditations) return
    
    // Update the title
    setPortfolio((prev) => {
      const updated = [...prev.licences_accreditations]
      updated[index] = { ...updated[index], title: selected.name }
      return { ...prev, licences_accreditations: updated }
    })
    
    // Get issuer suggestions based on selected title's name (exact match)
    try {
      // Get unique jurisdictions/issuing authorities for this exact licence name
      const { data, error } = await supabase
        .from('licences_accreditations_reference')
        .select('jurisdiction, issuing_authority')
        .eq('name', selected.name)
        .eq('is_active', true)

      if (error) {
        console.error('[Issuer Search] Error:', error)
        // Fallback to jurisdiction as issuer
        const issuerOptions = [selected.jurisdiction, selected.issuing_authority || selected.jurisdiction].filter(Boolean)
        setLicenceIssuerSuggestions(prev => ({ ...prev, [index]: [...new Set(issuerOptions)] }))
        
        // Auto-select issuer if available
        const defaultIssuer = selected.issuing_authority || selected.jurisdiction
        if (defaultIssuer) {
          setPortfolio((prev) => {
            const updated = [...prev.licences_accreditations]
            updated[index] = { ...updated[index], issuer: defaultIssuer }
            return { ...prev, licences_accreditations: updated }
          })
        }
        return
      }

      // Collect unique issuers (prefer issuing_authority, fallback to jurisdiction)
      const issuerSet = new Set<string>()
      data?.forEach(item => {
        if (item.issuing_authority && item.issuing_authority.trim()) {
          issuerSet.add(item.issuing_authority.trim())
        } else if (item.jurisdiction && item.jurisdiction.trim()) {
          issuerSet.add(item.jurisdiction.trim())
        }
      })
      
      // If no data found, use the selected suggestion's jurisdiction/issuing_authority
      if (issuerSet.size === 0) {
        if (selected.issuing_authority) issuerSet.add(selected.issuing_authority)
        if (selected.jurisdiction) issuerSet.add(selected.jurisdiction)
      }
      
      const issuerOptions = Array.from(issuerSet).sort()
      setLicenceIssuerSuggestions(prev => ({ ...prev, [index]: issuerOptions }))
      
      // Auto-select issuer if only one option
      if (issuerOptions.length === 1) {
        setPortfolio((prev) => {
          const updated = [...prev.licences_accreditations]
          updated[index] = { ...updated[index], issuer: issuerOptions[0] }
          return { ...prev, licences_accreditations: updated }
        })
      } else if (selected.issuing_authority) {
        // Pre-fill with issuing_authority if available
        setPortfolio((prev) => {
          const updated = [...prev.licences_accreditations]
          updated[index] = { ...updated[index], issuer: selected.issuing_authority || selected.jurisdiction || '' }
          return { ...prev, licences_accreditations: updated }
        })
      }
    } catch (err) {
      console.error('[Issuer Search] Exception:', err)
      const issuerOptions = [selected.jurisdiction, selected.issuing_authority || selected.jurisdiction].filter(Boolean)
      setLicenceIssuerSuggestions(prev => ({ ...prev, [index]: [...new Set(issuerOptions)] }))
      
      const defaultIssuer = selected.issuing_authority || selected.jurisdiction
      if (defaultIssuer) {
        setPortfolio((prev) => {
          const updated = [...prev.licences_accreditations]
          updated[index] = { ...updated[index], issuer: defaultIssuer }
          return { ...prev, licences_accreditations: updated }
        })
      }
    }
    
    // Clear suggestions and hide autocomplete
    setLicenceTitleSuggestions(prev => ({ ...prev, [index]: [] }))
    setActiveTitleAutocompleteIndex(null)
    setSelectedTitleIndex(prev => ({ ...prev, [index]: 0 }))
  }

  // Handle issuer input change
  const handleIssuerInputChange = (index: number, value: string) => {
    updateLicence(index, 'issuer', value)
    
    // Show autocomplete when user types (filtered suggestions are shown in the dropdown)
    if (value && licenceIssuerSuggestions[index] && licenceIssuerSuggestions[index].length > 0) {
      setActiveIssuerAutocompleteIndex(index)
    } else if (licenceIssuerSuggestions[index] && licenceIssuerSuggestions[index].length > 0) {
      // Show all suggestions if input is cleared
      setActiveIssuerAutocompleteIndex(index)
    }
  }

  const addSocialLink = () => {
    if (!sectionEdit.social) return
    setPortfolio((p) => ({
      ...p,
      socialLinks: [...(p.socialLinks || []), { platform: 'LinkedIn', url: '' }],
    }))
  }

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    if (!sectionEdit.social) return
    setPortfolio((p) => {
      const next = [...(p.socialLinks || [])]
      next[index] = { ...next[index], [field]: value }
      return { ...p, socialLinks: next }
    })
  }

  const removeSocialLink = (index: number) => {
    if (!sectionEdit.social) return
    setPortfolio((p) => ({ ...p, socialLinks: (p.socialLinks || []).filter((_, i) => i !== index) }))
  }

  async function saveSocialLinksToTalentBank() {
    try {
      const uid = await getUserId()
      if (!uid) {
        alert('Please sign in first.')
        return
      }
      await ensureUsersRow(uid)

      const links = (portfolio.socialLinks || []).map((s) => ({
        platform: String(s.platform || '').trim(),
        url: String(s.url || '').trim(),
      })).filter((s) => s.platform && s.url)

      if (!links.length) {
        alert('No social links to save.')
        return
      }

      for (const s of links) {
        // Insert as individual Talent Bank items so users can attach notes later.
        const title = s.platform
        const metadata = { platform: s.platform, url: s.url }
        const { error } = await supabase.from('talent_bank_items').insert({
          user_id: uid,
          item_type: 'social',
          title,
          metadata,
          is_public: false,
        } as any)
        if (error) {
          console.warn('Social insert failed:', error)
        }
      }

      alert(`Saved ${links.length} social link(s) to Talent Bank.`)
    } catch (e: any) {
      alert(`Failed to save social links: ${e?.message ?? String(e)}`)
    }
  }

  const addReferee = () => {
    if (!sectionEdit.referees) return
    setPortfolio((p) => ({
      ...p,
      referees: [
        ...p.referees,
        { name: '', relationship: '', company: '', title: '', email: '', phone: '', notes: '', attachmentIds: [] },
      ],
    }))
  }

  const updateReferee = (index: number, field: string, value: string) => {
    if (!sectionEdit.referees) return
    setPortfolio((p) => {
      const next = [...p.referees]
      next[index] = { ...next[index], [field]: value } as any
      return { ...p, referees: next }
    })
  }

  const removeReferee = (index: number) => {
    if (!sectionEdit.referees) return
    setPortfolio((p) => ({ ...p, referees: p.referees.filter((_, i) => i !== index) }))
  }

  async function openProjectImportModal(index: number) {
    setActiveProjectIndex(index)
    setProjectImportOpen(true)
    setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      await log('project import modal open', 'P_PROJ', { hasUser: !!uid, index })
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      await log('project import fetch talent_bank_items', 'P_PROJ', {
        hasError: !!error,
        rowCount: Array.isArray(data) ? data.length : 0,
        errorMessage: (error as any)?.message ?? null,
      })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      // For Projects, only allow attaching file-based Talent Bank items (physical artifacts):
      // images, videos, audio/podcasts, PDFs/docs, etc. (anything with a file_path).
      const filtered = (data ?? [])
        .filter((i: any) => i.item_type !== 'portfolio')
        .filter((i: any) => !!i.file_path)

      setAvailableItems(filtered as any)

      const pre = new Set<number>(Array.isArray(portfolio.projects[index]?.attachmentIds) ? (portfolio.projects[index].attachmentIds as any) : [])
      const nextSel: Record<number, boolean> = {}
      for (const it of filtered as any[]) {
        nextSel[it.id] = pre.has(it.id)
      }
      setProjectSelectedIds(nextSel)
    } finally {
      setIsImporting(false)
    }
  }

  async function openProjectImportFromHeader() {
    if (!sectionEdit.projects) return
    if (!portfolio.projects.length) {
      alert('Add a project first, then import files from Talent Bank into it.')
      return
    }
    const selectedIdx = Object.entries(bulkSel.projects)
      .filter(([, v]) => !!v)
      .map(([k]) => Number(k))
      .filter((n) => Number.isFinite(n))

    let target = 0
    if (portfolio.projects.length === 1) {
      target = 0
    } else if (selectedIdx.length === 1) {
      target = selectedIdx[0]
    } else {
      alert('Select exactly one Project (checkbox) first, then click "Import from Talent Bank".')
      return
    }
    await openProjectImportModal(target)
  }

  async function openPersonalDocImportFromHeader() {
    if (!sectionEdit.personal_documents) return
    if (!portfolio.personal_documents.length) {
      alert('Add a document first, then import files from Talent Bank into it.')
      return
    }
    const selectedIdx = Object.entries(bulkSel.personal_documents)
      .filter(([, v]) => !!v)
      .map(([k]) => Number(k))
      .filter((n) => Number.isFinite(n))

    let target = 0
    if (portfolio.personal_documents.length === 1) {
      target = 0
    } else if (selectedIdx.length === 1) {
      target = selectedIdx[0]
    } else {
      alert('Select exactly one Document (checkbox) first, then click "Import from Talent Bank".')
      return
    }
    await openPersonalDocImportModal(target)
  }

  async function openLicenceImportFromHeader() {
    if (!sectionEdit.licences_accreditations) return
    if (!portfolio.licences_accreditations.length) {
      alert('Add a licence/accreditation first, then import files from Talent Bank into it.')
      return
    }
    const selectedIdx = Object.entries(bulkSel.licences_accreditations)
      .filter(([, v]) => !!v)
      .map(([k]) => Number(k))
      .filter((n) => Number.isFinite(n))

    let target = 0
    if (portfolio.licences_accreditations.length === 1) {
      target = 0
    } else if (selectedIdx.length === 1) {
      target = selectedIdx[0]
    } else {
      alert('Select exactly one Licence/Accreditation (checkbox) first, then click "Import from Talent Bank".')
      return
    }
    await openLicenceImportModal(target)
  }

  async function openIntroVideoModal() {
    setIntroModalOpen(true)
    setIsImporting(true)
    setImportError(null)
    setIntroPreviewUrl(null)
    try {
      const uid = await getUserId()
      await log('intro video modal open', 'P_LAYOUT', { hasUser: !!uid })
      if (!uid) {
        setImportError('Please sign in to pick an intro video.')
        return
      }
      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      await log('intro video fetch talent_bank_items', 'P_LAYOUT', {
        hasError: !!error,
        rowCount: Array.isArray(data) ? data.length : 0,
        errorMessage: (error as any)?.message ?? null,
      })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }
      const vids = (data ?? []).filter((i: any) => !!i.file_path && (i.file_type?.startsWith?.('video') ?? false))
      setIntroItems(vids)
      const current = typeof portfolio.introVideoId === 'number' ? portfolio.introVideoId : null
      setIntroPickId(current)
      if (current) {
        const found = vids.find((v: any) => v.id === current)
        if (found?.file_path) {
          const { data: urlData } = await supabase.storage.from('talent-bank').createSignedUrl(found.file_path, 60 * 30)
          if (urlData?.signedUrl) setIntroPreviewUrl(urlData.signedUrl)
        }
      }
    } finally {
      setIsImporting(false)
    }
  }

  async function applyIntroVideo() {
    setPortfolio((prev) => ({ ...prev, introVideoId: introPickId }))
    await log('intro video applied', 'P_LAYOUT', { introVideoId: introPickId })
    setIntroModalOpen(false)
  }

  async function applyProjectImport() {
    try {
      if (activeProjectIndex == null) {
        setProjectImportOpen(false)
        return
      }
      const selected = availableItems.filter((i) => projectSelectedIds[i.id])
      const ids = selected.map((x) => x.id)
      await log('project import apply', 'P_PROJ', { index: activeProjectIndex, selectedCount: ids.length })
      setPortfolio((prev) => {
        const updated = [...prev.projects]
        const cur = updated[activeProjectIndex]
        if (!cur) return prev
        updated[activeProjectIndex] = { ...cur, attachmentIds: ids }
        return { ...prev, projects: updated }
      })
      setProjectImportOpen(false)
    } catch (e: any) {
      await log('project import apply exception', 'P_PROJ', { message: e?.message ?? String(e) })
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  async function openEducationImportModal(index: number) {
    setEducationImportOpen(true)
    setActiveEducationIndex(index)
    setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      // For Education, only allow attaching file-based Talent Bank items (documents, PDFs, etc.)
      const filtered = (data ?? [])
        .filter((i: any) => i.item_type !== 'portfolio')
        .filter((i: any) => !!i.file_path)

      setAvailableItems(filtered as any)

      const pre = new Set<number>(Array.isArray(portfolio.education[index]?.attachmentIds) ? (portfolio.education[index].attachmentIds as any) : [])
      const nextSel: Record<number, boolean> = {}
      for (const it of filtered as any[]) {
        nextSel[it.id] = pre.has(it.id)
      }
      setEducationSelectedIds(nextSel)
    } finally {
      setIsImporting(false)
    }
  }

  async function applyEducationImport() {
    try {
      if (activeEducationIndex == null) {
        setEducationImportOpen(false)
        return
      }
      const selected = availableItems.filter((i) => educationSelectedIds[i.id])
      const ids = selected.map((x) => x.id)
      setPortfolio((prev) => {
        const updated = [...prev.education]
        const cur = updated[activeEducationIndex]
        if (!cur) return prev
        updated[activeEducationIndex] = { ...cur, attachmentIds: ids }
        return { ...prev, education: updated }
      })
      setEducationImportOpen(false)
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  async function openRefereeImportModal(index: number) {
    setRefereeImportOpen(true)
    setActiveRefereeIndex(index)
    setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      // For Referees, only allow attaching file-based Talent Bank items (documents, PDFs, etc.)
      const filtered = (data ?? [])
        .filter((i: any) => i.item_type !== 'portfolio')
        .filter((i: any) => !!i.file_path)

      setAvailableItems(filtered as any)

      const pre = new Set<number>(Array.isArray(portfolio.referees[index]?.attachmentIds) ? (portfolio.referees[index].attachmentIds as any) : [])
      const nextSel: Record<number, boolean> = {}
      for (const it of filtered as any[]) {
        nextSel[it.id] = pre.has(it.id)
      }
      setRefereeSelectedIds(nextSel)
    } finally {
      setIsImporting(false)
    }
  }

  async function applyRefereeImport() {
    try {
      if (activeRefereeIndex == null) {
        setRefereeImportOpen(false)
        return
      }
      const selected = availableItems.filter((i) => refereeSelectedIds[i.id])
      const ids = selected.map((x) => x.id)
      setPortfolio((prev) => {
        const updated = [...prev.referees]
        const cur = updated[activeRefereeIndex]
        if (!cur) return prev
        updated[activeRefereeIndex] = { ...cur, attachmentIds: ids }
        return { ...prev, referees: updated }
      })
      setRefereeImportOpen(false)
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  // Personal Documents import functions
  async function openPersonalDocImportModal(index: number) {
    setActivePersonalDocIndex(index)
    setPersonalDocImportOpen(true)
    setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        setIsImporting(false)
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      const filtered = (data ?? []).filter((i: any) => !!i.file_path)
      setAvailableItems(filtered as any)

      const pre = new Set<number>(Array.isArray(portfolio.personal_documents[index]?.attachmentIds) ? (portfolio.personal_documents[index].attachmentIds as any) : [])
      const nextSel: Record<number, boolean> = {}
      for (const it of filtered as any[]) {
        nextSel[it.id] = pre.has(it.id)
      }
      setPersonalDocSelectedIds(nextSel)
    } finally {
      setIsImporting(false)
    }
  }

  async function applyPersonalDocImport() {
    try {
      if (activePersonalDocIndex == null) {
        setPersonalDocImportOpen(false)
        return
      }
      const selected = availableItems.filter((i) => personalDocSelectedIds[i.id])
      const ids = selected.map((x) => x.id)
      setPortfolio((prev) => {
        const updated = [...prev.personal_documents]
        const cur = updated[activePersonalDocIndex]
        if (!cur) return prev
        updated[activePersonalDocIndex] = { ...cur, attachmentIds: ids }
        return { ...prev, personal_documents: updated }
      })
      setPersonalDocImportOpen(false)
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  // Licences and Accreditations import functions
  async function openLicenceImportModal(index: number) {
    setActiveLicenceIndex(index)
    setLicenceImportOpen(true)
    setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        setIsImporting(false)
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      const filtered = (data ?? []).filter((i: any) => !!i.file_path)
      setAvailableItems(filtered as any)

      const pre = new Set<number>(Array.isArray(portfolio.licences_accreditations[index]?.attachmentIds) ? (portfolio.licences_accreditations[index].attachmentIds as any) : [])
      const nextSel: Record<number, boolean> = {}
      for (const it of filtered as any[]) {
        nextSel[it.id] = pre.has(it.id)
      }
      setLicenceSelectedIds(nextSel)
    } finally {
      setIsImporting(false)
    }
  }

  async function applyLicenceImport() {
    try {
      if (activeLicenceIndex == null) {
        setLicenceImportOpen(false)
        return
      }
      const selected = availableItems.filter((i) => licenceSelectedIds[i.id])
      const ids = selected.map((x) => x.id)
      setPortfolio((prev) => {
        const updated = [...prev.licences_accreditations]
        const cur = updated[activeLicenceIndex]
        if (!cur) return prev
        updated[activeLicenceIndex] = { ...cur, attachmentIds: ids }
        return { ...prev, licences_accreditations: updated }
      })
      setLicenceImportOpen(false)
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  // Family and Community import functions
  async function openFamilyCommunityImportModal() {
    if (!sectionEdit.family_community) return
    setFamilyCommunityImportOpen(true)
    setIsImporting(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to import from Talent Bank.')
        setIsImporting(false)
        return
      }

      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        setImportError((error as any)?.message ?? 'Failed to load Talent Bank items')
        return
      }

      // Filter for images only
      const filtered = (data ?? []).filter((i: any) => {
        if (!i.file_path) return false
        const itemType = String(i.item_type || '').toLowerCase()
        const fileType = String(i.file_type || '').toLowerCase()
        return itemType === 'image' || fileType.startsWith('image/')
      })
      setAvailableItems(filtered as any)

      const pre = new Set<number>(Array.isArray(portfolio.family_community?.imageIds) ? (portfolio.family_community.imageIds as any) : [])
      const nextSel: Record<number, boolean> = {}
      for (const it of filtered as any[]) {
        nextSel[it.id] = pre.has(it.id)
      }
      setFamilyCommunitySelectedIds(nextSel)
    } finally {
      setIsImporting(false)
    }
  }

  async function applyFamilyCommunityImport() {
    try {
      const selected = availableItems.filter((i) => familyCommunitySelectedIds[i.id])
      const ids = selected.map((x) => x.id)
      setPortfolio((prev) => ({
        ...prev,
        family_community: {
          imageIds: ids,
          descriptions: prev.family_community?.descriptions || {}
        }
      }))
      setFamilyCommunityImportOpen(false)
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to import')
    }
  }

  const BUCKET = 'talent-bank'
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

  // Generic upload function that works for any import modal
  async function uploadToTalentBank(
    file: File,
    options: {
      itemType?: string
      acceptFileTypes?: (file: File) => boolean
      onSuccess?: () => Promise<void> // Callback to reload items
    } = {}
  ) {
    setUploading(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to upload files.')
        return
      }

      // Check file type if validator provided
      if (options.acceptFileTypes && !options.acceptFileTypes(file)) {
        setImportError('Please upload a valid file type for this section.')
        return
      }

      // Check file size
      if (file.size > MAX_UPLOAD_BYTES) {
        const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10
        const limitMb = Math.round((MAX_UPLOAD_BYTES / (1024 * 1024)) * 10) / 10
        setImportError(`File is ${sizeMb}MB, which exceeds the upload limit (~${limitMb}MB).`)
        return
      }

      // Determine item type
      const itemType = options.itemType || 
        (file.type.startsWith('image/') ? 'image' : 
         file.type.startsWith('video/') ? 'video' : 'document')

      // Upload to Supabase Storage
      const path = `${uid}/${crypto.randomUUID()}-${file.name}`
      const { error: storageError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type })
      
      if (storageError) {
        setImportError(`Upload failed: ${(storageError as any)?.message ?? 'Unknown error'}`)
        return
      }

      // Create talent bank item
      const insertPayload = {
        user_id: uid,
        item_type: itemType,
        title: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        metadata: {
          file_kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
          source: 'portfolio_upload',
        },
        is_public: false,
      }

      const { error: insertError } = await supabase.from('talent_bank_items').insert(insertPayload as any)
      
      if (insertError) {
        // Clean up uploaded file on error
        await supabase.storage.from(BUCKET).remove([path])
        setImportError(`Failed to save file: ${(insertError as any)?.message ?? 'Unknown error'}`)
        return
      }

      // Reload items using callback if provided
      if (options.onSuccess) {
        await options.onSuccess()
      }
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  // Generic function to add file from URL
  async function addFromUrl(
    url: string,
    options: {
      itemType?: string
      acceptContentTypes?: (contentType: string) => boolean
      onSuccess?: () => Promise<void>
    } = {}
  ) {
    setUploading(true)
    setImportError(null)
    try {
      const uid = await getUserId()
      if (!uid) {
        setImportError('Please sign in to add files from URL.')
        return
      }

      const urlTrimmed = url.trim()
      if (!urlTrimmed) {
        setImportError('Please enter a URL')
        return
      }

      // Validate URL
      try {
        new URL(urlTrimmed)
      } catch {
        setImportError('Please enter a valid URL')
        return
      }

      // Fetch the file
      const response = await fetch(urlTrimmed)
      if (!response.ok) {
        setImportError(`Failed to fetch file from URL: ${response.status} ${response.statusText}`)
        return
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      
      // Check content type if validator provided
      if (options.acceptContentTypes && !options.acceptContentTypes(contentType)) {
        setImportError('URL must point to a valid file type for this section.')
        return
      }

      const blob = await response.blob()
      const extension = contentType.split('/')[1] || 'bin'
      const file = new File([blob], `file-from-url-${Date.now()}.${extension}`, { type: contentType })

      // Determine item type
      const itemType = options.itemType || 
        (contentType.startsWith('image/') ? 'image' : 
         contentType.startsWith('video/') ? 'video' : 'document')

      // Upload the file
      if (file.size > MAX_UPLOAD_BYTES) {
        const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10
        const limitMb = Math.round((MAX_UPLOAD_BYTES / (1024 * 1024)) * 10) / 10
        setImportError(`File is ${sizeMb}MB, which exceeds the upload limit (~${limitMb}MB).`)
        return
      }

      // Upload to Supabase Storage
      const path = `${uid}/${crypto.randomUUID()}-${file.name}`
      const { error: storageError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type })
      
      if (storageError) {
        setImportError(`Upload failed: ${(storageError as any)?.message ?? 'Unknown error'}`)
        return
      }

      // Create talent bank item
      const insertPayload = {
        user_id: uid,
        item_type: itemType,
        title: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        metadata: {
          file_kind: contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : 'document',
          source: 'portfolio_url_upload',
        },
        is_public: false,
      }

      const { error: insertError } = await supabase.from('talent_bank_items').insert(insertPayload as any)
      
      if (insertError) {
        // Clean up uploaded file on error
        await supabase.storage.from(BUCKET).remove([path])
        setImportError(`Failed to save file: ${(insertError as any)?.message ?? 'Unknown error'}`)
        return
      }

      // Reload items using callback if provided
      if (options.onSuccess) {
        await options.onSuccess()
      }
      
      // Clear URL on success
      setUploadUrl('')
    } catch (e: any) {
      setImportError(e?.message ?? 'Failed to add file from URL')
    } finally {
      setUploading(false)
    }
  }

  // Legacy functions for Family Community (now use generic functions)
  async function uploadFamilyCommunityFile(file: File) {
    await uploadToTalentBank(file, {
      itemType: 'image',
      acceptFileTypes: (f) => f.type.startsWith('image/'),
      onSuccess: openFamilyCommunityImportModal,
    })
  }

  async function addFamilyCommunityFromUrl() {
    await addFromUrl(familyCommunityUploadUrl, {
      itemType: 'image',
      acceptContentTypes: (ct) => ct.startsWith('image/'),
      onSuccess: openFamilyCommunityImportModal,
    })
  }

  // Helper function to render upload UI for any import modal
  function renderUploadUI(options: {
    acceptFileTypes?: string // e.g., "image/*", "application/pdf", etc.
    acceptFileTypesValidator?: (file: File) => boolean
    acceptContentTypesValidator?: (contentType: string) => boolean
    itemType?: string
    onSuccess: () => Promise<void>
  }) {
    return (
      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-2">Add files not in Talent Bank:</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={options.acceptFileTypes || '*'}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                uploadToTalentBank(file, {
                  itemType: options.itemType,
                  acceptFileTypes: options.acceptFileTypesValidator,
                  onSuccess: options.onSuccess,
                })
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isImporting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {uploading ? 'Uploading...' : '📤 Upload from Computer'}
          </button>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="Paste file URL here..."
              disabled={uploading || isImporting}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !uploading && !isImporting) {
                  addFromUrl(uploadUrl, {
                    itemType: options.itemType,
                    acceptContentTypes: options.acceptContentTypesValidator,
                    onSuccess: options.onSuccess,
                  })
                }
              }}
            />
            <button
              type="button"
              onClick={() => addFromUrl(uploadUrl, {
                itemType: options.itemType,
                acceptContentTypes: options.acceptContentTypesValidator,
                onSuccess: options.onSuccess,
              })}
              disabled={uploading || isImporting || !uploadUrl.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {uploading ? 'Adding...' : '🔗 Add from URL'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const savePortfolio = async (opts?: { redirect?: boolean; source?: string }) => {
    try {
      const uid = await getUserId()
      await log('savePortfolio start', 'P_SAVE', { hasUser: !!uid, redirect: !!opts?.redirect, source: opts?.source ?? null })
      if (!uid) {
        alert('Please sign in to save your portfolio.')
        return false
      }

      const usersRowExists = await ensureUsersRow(uid)
      if (!usersRowExists) {
        const errorMsg = 'Cannot save portfolio: Your user account is not properly set up in the database. Please contact support or ensure migration 2025122208_users_self_row.sql has been run.'
        console.error('[PortfolioEditor] CRITICAL: Could not ensure users row exists. Aborting save.')
        console.error('[PortfolioEditor] Migration 2025122208_users_self_row.sql must be run in Supabase.')
        alert(errorMsg)
        return false
      }

      // Update existing portfolio item if present; otherwise insert a new one.
      const existing = await supabase
        .from('talent_bank_items')
        .select('id,metadata')
        .eq('user_id', uid)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)

      const existingId = existing.data?.[0]?.id ?? null
      const existingMeta = (existing.data?.[0] as any)?.metadata ?? {}
      const keepSelections = Array.isArray(existingMeta?.portfolioSelections) ? existingMeta.portfolioSelections : []
      
      // Explicitly preserve attachmentIds for education, projects, and referees
      const payloadMeta = {
        ...portfolio,
        portfolioSelections: keepSelections,
        education: Array.isArray(portfolio.education)
          ? portfolio.education.map((e) => ({
              ...e,
              attachmentIds: Array.isArray(e.attachmentIds) ? e.attachmentIds : []
            }))
          : portfolio.education,
        projects: Array.isArray(portfolio.projects)
          ? portfolio.projects.map((p) => ({
              ...p,
              attachmentIds: Array.isArray(p.attachmentIds) ? p.attachmentIds : []
            }))
          : portfolio.projects,
        referees: Array.isArray(portfolio.referees)
          ? portfolio.referees.map((r) => ({
              ...r,
              attachmentIds: Array.isArray(r.attachmentIds) ? r.attachmentIds : []
            }))
          : portfolio.referees,
      }
      
      // Debug: Log education attachmentIds being saved
      if (Array.isArray(payloadMeta.education) && payloadMeta.education.length > 0) {
        console.log('[PortfolioEditor] Saving education with attachmentIds:', payloadMeta.education.map((e: any, i: number) => ({
          index: i,
          institution: e?.institution,
          degree: e?.degree,
          attachmentIds: e?.attachmentIds,
          attachmentIdsType: typeof e?.attachmentIds,
          attachmentIdsIsArray: Array.isArray(e?.attachmentIds),
        })))
      }
      
      await log('savePortfolio projects summary', 'P_PROJ', {
        projectCount: Array.isArray((payloadMeta as any)?.projects) ? (payloadMeta as any).projects.length : 0,
        projectsWithAttachments: Array.isArray((payloadMeta as any)?.projects)
          ? (payloadMeta as any).projects.filter((p: any) => Array.isArray(p?.attachmentIds) && p.attachmentIds.length).length
          : 0,
        totalProjectAttachmentIds: Array.isArray((payloadMeta as any)?.projects)
          ? (payloadMeta as any).projects.reduce((n: number, p: any) => n + (Array.isArray(p?.attachmentIds) ? p.attachmentIds.length : 0), 0)
          : 0,
      })
      await log('savePortfolio layout summary', 'P_LAYOUT', {
        sectionOrderLen: Array.isArray((payloadMeta as any)?.sectionOrder) ? (payloadMeta as any).sectionOrder.length : 0,
        introVideoId: (payloadMeta as any)?.introVideoId ?? null,
      })

      if (existingId) {
        // Log what we're about to save
        const educationWithAttachments = Array.isArray(payloadMeta.education) 
          ? payloadMeta.education.filter((e: any) => Array.isArray(e?.attachmentIds) && e.attachmentIds.length > 0)
          : []
        const projectsWithAttachments = Array.isArray(payloadMeta.projects)
          ? payloadMeta.projects.filter((p: any) => Array.isArray(p?.attachmentIds) && p.attachmentIds.length > 0)
          : []
        console.log('[PortfolioEditor] Updating portfolio with:', {
          educationEntriesWithAttachments: educationWithAttachments.length,
          projectEntriesWithAttachments: projectsWithAttachments.length,
          totalEducationEntries: Array.isArray(payloadMeta.education) ? payloadMeta.education.length : 0,
          totalProjectEntries: Array.isArray(payloadMeta.projects) ? payloadMeta.projects.length : 0,
        })
        
        const { error, data } = await supabase
          .from('talent_bank_items')
          .update({ title: 'Portfolio', metadata: payloadMeta })
          .eq('id', existingId)
          .eq('user_id', uid)
          .select('id, metadata')
        await log('savePortfolio update', 'P_SAVE', {
          hasError: !!error,
          errorCode: (error as any)?.code ?? null,
          errorMessage: (error as any)?.message ?? null,
          errorDetails: (error as any)?.details ?? null,
          httpStatus: (error as any)?.status ?? null,
        })
        if (error) {
          console.error('[PortfolioEditor] Save failed:', error)
          // Check for 403/RLS errors specifically
          const status = (error as any)?.status ?? (error as any)?.code
          if (status === 403 || String(error?.message || '').includes('policy') || String(error?.message || '').includes('RLS')) {
            alert('Cannot save portfolio: Database permissions error. Your account may not have the required permissions. Please contact support.')
            return false
          }
          throw error
        }
        // CRITICAL: Verify the save actually succeeded by checking the response
        if (!data || !data[0]) {
          console.error('[PortfolioEditor] Save returned no data - save may have failed silently')
          alert('Portfolio save may have failed. Please refresh and try again.')
          return false
        }
        // Verify what was actually saved
        const savedMeta = data[0].metadata as any
        const savedEducationWithAttachments = Array.isArray(savedMeta?.education)
          ? savedMeta.education.filter((e: any) => Array.isArray(e?.attachmentIds) && e.attachmentIds.length > 0)
          : []
        console.log('[PortfolioEditor] Portfolio updated successfully. Saved education entries with attachments:', savedEducationWithAttachments.length)
        
        // Reload portfolio from database to ensure UI reflects saved state
        await loadSavedPortfolio()
      } else {
        // Log what we're about to insert
        const educationWithAttachments = Array.isArray(payloadMeta.education) 
          ? payloadMeta.education.filter((e: any) => Array.isArray(e?.attachmentIds) && e.attachmentIds.length > 0)
          : []
        const projectsWithAttachments = Array.isArray(payloadMeta.projects)
          ? payloadMeta.projects.filter((p: any) => Array.isArray(p?.attachmentIds) && p.attachmentIds.length > 0)
          : []
        console.log('[PortfolioEditor] Inserting new portfolio with:', {
          educationEntriesWithAttachments: educationWithAttachments.length,
          projectEntriesWithAttachments: projectsWithAttachments.length,
        })
        
        const { error, data } = await supabase.from('talent_bank_items').insert({
          user_id: uid,
          item_type: 'portfolio',
          title: 'Portfolio',
          metadata: payloadMeta,
          is_public: false,
        }).select('id, metadata')
        await log('savePortfolio insert', 'P_SAVE', {
          hasError: !!error,
          errorCode: (error as any)?.code ?? null,
          errorMessage: (error as any)?.message ?? null,
          errorDetails: (error as any)?.details ?? null,
          httpStatus: (error as any)?.status ?? null,
        })
        if (error) {
          console.error('[PortfolioEditor] Insert failed:', error)
          // Check for 403/RLS errors specifically
          const status = (error as any)?.status ?? (error as any)?.code
          if (status === 403 || String(error?.message || '').includes('policy') || String(error?.message || '').includes('RLS')) {
            alert('Cannot save portfolio: Database permissions error. Your account may not have the required permissions. Please contact support.')
            return false
          }
          throw error
        }
        // CRITICAL: Verify the insert actually succeeded
        if (!data || !data[0]) {
          console.error('[PortfolioEditor] Insert returned no data - save may have failed silently')
          alert('Portfolio save may have failed. Please refresh and try again.')
          return false
        }
        // Verify what was actually saved
        const savedMeta = data[0].metadata as any
        const savedEducationWithAttachments = Array.isArray(savedMeta?.education)
          ? savedMeta.education.filter((e: any) => Array.isArray(e?.attachmentIds) && e.attachmentIds.length > 0)
          : []
        console.log('[PortfolioEditor] Portfolio inserted successfully. Saved education entries with attachments:', savedEducationWithAttachments.length)
        
        // Reload portfolio from database to ensure UI reflects saved state
        await loadSavedPortfolio()
      }

      if (opts?.redirect) {
        alert('Portfolio saved successfully!')
        router.push('/dashboard/talent?tab=profile')
      } else {
        // Silent save - no alert for section saves or top-level save
      }
      return true
    } catch (error: any) {
      console.error('Error:', error)
      await log('savePortfolio exception', 'P_SAVE', {
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        details: error?.details ?? null,
      })
      const msg = String(error?.message ?? '')
      if (msg.includes('talent_bank_items_user_id_fkey') || msg.toLowerCase().includes('violates foreign key constraint')) {
        alert(
          'Error saving portfolio: your database requires a matching row in public.users for this account before writing to talent_bank_items.\n\n' +
            'Fix:\n' +
            '- Run Supabase migration `2025122208_users_self_row.sql` (then refresh schema cache)\n' +
            '- Sign out + sign in again\n' +
            '- Retry saving the portfolio.'
        )
      } else {
        alert(error?.message ? `Error saving portfolio: ${error.message}` : 'Error saving portfolio')
      }
      return false
    }
  }

  async function saveSection(sectionKey: string) {
    setSavingSection(sectionKey)
    await log('section save clicked', 'P_UI', { section: sectionKey })
    const ok = await savePortfolio({ redirect: false, source: `section:${sectionKey}` })
    if (ok) setSectionEdit((prev) => ({ ...prev, [sectionKey]: false }))
    setSavingSection(null)
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold truncate pr-4">{preview.title}</div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              {preview.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.title} className="max-h-[75vh] w-auto object-contain" />
              ) : (
                <video src={preview.url} controls className="max-h-[75vh] w-auto object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard/talent" className="text-slate-300 hover:text-blue-400">← Back</Link>
          <div className="flex items-center gap-3">
            <Link
              href="/portfolio/templates"
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 border border-purple-500/50 font-semibold"
            >
              Choose Template
            </Link>
            <Link href="/portfolio/view" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 border border-purple-500/50 font-semibold">
              View Portfolio
            </Link>
            <button
              type="button"
              onClick={async () => {
                await savePortfolio({ redirect: false, source: 'top-save-all' })
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-semibold"
            >
              Save
            </button>
          </div>
        </div>
          {/* Section Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-basic')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Basic
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-social')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Social
            </button>
                  <button
                    type="button"
              onClick={() => {
                const el = document.getElementById('section-skills')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Skills
                  </button>
                  <button
                    type="button"
              onClick={() => {
                const el = document.getElementById('section-experience')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Experience
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-education')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Education
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-referees')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Referees
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-projects')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-personal-documents')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-licences')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Licences
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-family-community')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Family
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('section-attachments')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium whitespace-nowrap"
            >
              Attachments
                  </button>
                </div>
        </div>
      </header>


      <main className="max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-3xl font-bold">Edit Portfolio</h1>
          <div className="text-xs text-slate-400">
            Tip: Use section Save buttons to save as you go.
          </div>
        </div>

        {/* Basic Information */}
        <section id="section-basic" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <div className="flex gap-2">
              {!sectionEdit.basic ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, basic: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'basic'}
                  onClick={() => saveSection('basic')}
                >
                  {savingSection === 'basic' ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
          <div className="mb-5 grid md:grid-cols-2 gap-4">
            <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
              <div className="h-28 w-full bg-slate-900 relative">
                {bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    No banner yet
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="text-sm text-slate-200 font-medium">Banner</div>
                <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!sectionEdit.basic}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadPortfolioImage('banner', f)
                      e.currentTarget.value = ''
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
              <div className="p-3 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border border-white/10 bg-slate-900 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs text-slate-400">No photo</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-200 font-medium">Avatar</div>
                  <div className="text-xs text-slate-400">Square headshot works best</div>
                </div>
                <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!sectionEdit.basic}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadPortfolioImage('avatar', f)
                      e.currentTarget.value = ''
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={portfolio.name}
              onChange={(e) => setPortfolio((prev) => ({ ...prev, name: e.target.value }))}
              disabled={!sectionEdit.basic}
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
            />
            <input
              type="text"
              placeholder="Professional Title"
              value={portfolio.title}
              onChange={(e) => setPortfolio((prev) => ({ ...prev, title: e.target.value }))}
              disabled={!sectionEdit.basic}
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
            />
            <CollapsibleTextarea
              value={portfolio.bio}
              onChange={(e) => setPortfolio((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Bio / Summary"
              disabled={!sectionEdit.basic}
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
              expandKey="bio"
              expanded={!!expandedTextareas['bio']}
              onToggle={toggleTextarea}
              defaultRows={5}
            />
          </div>
        </section>

        {/* Social */}
        <section id="section-social" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Social</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.social ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, social: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'social'}
                  onClick={() => saveSection('social')}
                >
                  {savingSection === 'social' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={addSocialLink}
                disabled={!sectionEdit.social}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
              >
                Add social link
              </button>
              <button
                type="button"
                onClick={saveSocialLinksToTalentBank}
                disabled={!sectionEdit.social || (portfolio.socialLinks || []).filter((s) => String(s?.url || '').trim()).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                Save to Talent Bank
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 mb-4">
            Pick a platform and paste your profile link. Supported top platforms: {SOCIAL_PLATFORMS.join(', ')}.
          </div>

          {portfolio.socialLinks.length === 0 ? (
            <div className="text-sm text-slate-400">No social links added yet.</div>
          ) : (
            <div className="space-y-3">
              {portfolio.socialLinks.map((s, idx) => (
                <div key={idx} className="p-4 border border-white/10 rounded-xl bg-slate-900/40">
                  <div className="grid md:grid-cols-12 gap-2 items-center">
                    <div className="md:col-span-3">
                      <select
                        value={s.platform}
                        onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                        disabled={!sectionEdit.social}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white disabled:opacity-60"
                      >
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="url"
                        placeholder="https://…"
                        value={s.url}
                        onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                        disabled={!sectionEdit.social}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSocialLink(idx)}
                        disabled={!sectionEdit.social}
                        className="text-xs text-red-300 underline disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skills */}
        <section id="section-skills" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Skills</h2>
            <div className="flex gap-2">
              {!sectionEdit.skills ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, skills: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'skills'}
                  onClick={() => saveSection('skills')}
                >
                  {savingSection === 'skills' ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
          {sectionEdit.skills && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.skills.map((_, i) => String(i)), bulkSel.skills)}
                  onChange={(e) => bulkSetAll('skills', portfolio.skills.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.skills.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.skills) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('skills')}
              >
                Delete selected ({bulkCount(bulkSel.skills)})
              </button>
            </div>
          )}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Add skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              disabled={!sectionEdit.skills}
              className="flex-1 p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
            />
            <button
              onClick={addSkill}
              disabled={!sectionEdit.skills}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full flex items-center gap-2 text-sm"
              >
                {sectionEdit.skills && (
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={!!bulkSel.skills[String(index)]}
                    onChange={(e) => bulkToggleKey('skills', String(index), e.target.checked)}
                  />
                )}
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  disabled={!sectionEdit.skills}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section id="section-experience" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Work Experience</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.experience ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, experience: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'experience'}
                  onClick={() => saveSection('experience')}
                >
                  {savingSection === 'experience' ? 'Saving…' : 'Save'}
                </button>
              )}
            <button
              type="button"
              onClick={addExperience}
                disabled={!sectionEdit.experience}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
            >
              Add Experience
            </button>
            <button
              type="button"
                onClick={openImportModal}
                disabled={isImporting || !sectionEdit.experience}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : 'Import from Talent Bank'}
            </button>
            </div>
          </div>
          {sectionEdit.experience && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.experience.map((_, i) => String(i)), bulkSel.experience)}
                  onChange={(e) => bulkSetAll('experience', portfolio.experience.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.experience.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.experience) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('experience')}
              >
                Delete selected ({bulkCount(bulkSel.experience)})
              </button>
            </div>
          )}
          {portfolio.experience.map((exp, index) => (
            <div key={index} className="mb-4 p-4 border border-white/10 rounded-xl bg-slate-900/40">
              <div className="flex items-center justify-between gap-3 mb-2">
                {sectionEdit.experience ? (
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!bulkSel.experience[String(index)]}
                      onChange={(e) => bulkToggleKey('experience', String(index), e.target.checked)}
                    />
                    Select
                  </label>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  disabled={!sectionEdit.experience}
                  className="text-xs text-red-300 underline disabled:opacity-60"
                  onClick={() => removeExperience(index)}
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                disabled={!sectionEdit.experience}
                className="w-full mb-2 p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={exp.title}
                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                disabled={!sectionEdit.experience}
                className="w-full mb-2 p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Start Date"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  disabled={!sectionEdit.experience}
                  className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                />
                <input
                  type="text"
                  placeholder="End Date"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                  disabled={!sectionEdit.experience}
                  className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                />
              </div>
              <CollapsibleTextarea
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                placeholder="Description"
                disabled={!sectionEdit.experience}
                className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                expandKey={`experience-${index}`}
                expanded={!!expandedTextareas[`experience-${index}`]}
                onToggle={toggleTextarea}
                defaultRows={5}
              />
            </div>
          ))}
        </section>

        {/* Education */}
        <section id="section-education" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Education</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.education ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, education: true }))}>
                  Edit
                </button>
              ) : (
          <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'education'}
                  onClick={() => saveSection('education')}
                >
                  {savingSection === 'education' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={addEducation}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
              >
                Add Education
              </button>
              <button
                type="button"
                onClick={openImportModal}
                disabled={isImporting || !sectionEdit.education}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : 'Import from Talent Bank'}
          </button>
        </div>
      </div>

          {sectionEdit.education && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.education.map((_, i) => String(i)), bulkSel.education)}
                  onChange={(e) => bulkSetAll('education', portfolio.education.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.education.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.education) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('education')}
              >
                Delete selected ({bulkCount(bulkSel.education)})
              </button>
            </div>
          )}

          {portfolio.education.length === 0 ? (
            <div className="text-sm text-slate-400">No education added yet.</div>
          ) : (
            <div className="space-y-4">
              {portfolio.education.map((edu, index) => (
                <div key={index} className="p-4 border border-white/10 rounded-xl bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {sectionEdit.education && (
                        <input
                          type="checkbox"
                          checked={!!bulkSel.education[String(index)]}
                          onChange={(e) => bulkToggleKey('education', String(index), e.target.checked)}
                        />
                      )}
                      <div className="text-sm font-semibold text-slate-200">Education entry {index + 1}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.education}
                      className="text-xs text-red-300 underline disabled:opacity-60"
                      onClick={() => removeEducation(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      disabled={!sectionEdit.education}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Degree / Qualification"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      disabled={!sectionEdit.education}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Field of Study"
                      value={edu.field}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      disabled={!sectionEdit.education}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Year (or date range)"
                      value={edu.year}
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      disabled={!sectionEdit.education}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                  </div>
                  {sectionEdit.education && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => openEducationImportModal(index)}
                        disabled={isImporting}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
                      >
                        {isImporting ? 'Loading…' : 'Attach Degree Document'}
                      </button>
                      {Array.isArray(edu.attachmentIds) && edu.attachmentIds.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-slate-400 mb-2">
                            Attached files: <span className="text-slate-200 font-semibold">{edu.attachmentIds.length}</span>
                          </div>
                          <div className="space-y-2">
                            {edu.attachmentIds.slice(0, 3).map((id: any) => (
                              <ProjectAttachmentChip key={id} id={Number(id)} onRemove={() => {}} />
                            ))}
                            {edu.attachmentIds.length > 3 && (
                              <div className="text-xs text-slate-400 px-1">+{edu.attachmentIds.length - 3} more…</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-xs text-slate-400">
            Tip: Upload certificates in Talent Bank under “Education” then import them here.
          </div>
        </section>

        {/* Referees */}
        <section id="section-referees" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Referees</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.referees ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, referees: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'referees'}
                  onClick={() => saveSection('referees')}
                >
                  {savingSection === 'referees' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={addReferee}
                disabled={!sectionEdit.referees}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
              >
                Add Referee
              </button>
            </div>
          </div>

          {sectionEdit.referees && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.referees.map((_, i) => String(i)), bulkSel.referees)}
                  onChange={(e) => bulkSetAll('referees', portfolio.referees.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.referees.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.referees) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('referees')}
              >
                Delete selected ({bulkCount(bulkSel.referees)})
              </button>
            </div>
          )}

          {portfolio.referees.length === 0 ? (
            <div className="text-sm text-slate-400">No referees added yet.</div>
          ) : (
            <div className="space-y-4">
              {portfolio.referees.map((r, index) => (
                <div key={index} className="p-4 border border-white/10 rounded-xl bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {sectionEdit.referees && (
                        <input
                          type="checkbox"
                          checked={!!bulkSel.referees[String(index)]}
                          onChange={(e) => bulkToggleKey('referees', String(index), e.target.checked)}
                        />
                      )}
                      <div className="text-sm font-semibold text-slate-200 truncate">Referee {index + 1}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.referees}
                      className="text-xs text-red-300 underline disabled:opacity-60"
                      onClick={() => removeReferee(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={r.name}
                      onChange={(e) => updateReferee(index, 'name', e.target.value)}
                      disabled={!sectionEdit.referees}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={r.relationship}
                      onChange={(e) => updateReferee(index, 'relationship', e.target.value)}
                      disabled={!sectionEdit.referees}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={r.company}
                      onChange={(e) => updateReferee(index, 'company', e.target.value)}
                      disabled={!sectionEdit.referees}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Title"
                      value={r.title}
                      onChange={(e) => updateReferee(index, 'title', e.target.value)}
                      disabled={!sectionEdit.referees}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={r.email}
                      onChange={(e) => updateReferee(index, 'email', e.target.value)}
                      disabled={!sectionEdit.referees}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={r.phone}
                      onChange={(e) => updateReferee(index, 'phone', e.target.value)}
                      disabled={!sectionEdit.referees}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <div className="md:col-span-2">
                      <CollapsibleTextarea
                        value={r.notes}
                        onChange={(e) => updateReferee(index, 'notes', e.target.value)}
                        placeholder="Notes"
                        disabled={!sectionEdit.referees}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                        expandKey={`referee-${index}`}
                        expanded={!!expandedTextareas[`referee-${index}`]}
                        onToggle={toggleTextarea}
                        defaultRows={5}
                      />
                    </div>
                  </div>
                  {sectionEdit.referees && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => openRefereeImportModal(index)}
                        disabled={isImporting}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
                      >
                        {isImporting ? 'Loading…' : 'Attach Document'}
                      </button>
                      {Array.isArray(r.attachmentIds) && r.attachmentIds.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-slate-400 mb-2">
                            Attached files: <span className="text-slate-200 font-semibold">{r.attachmentIds.length}</span>
                          </div>
                          <div className="space-y-2">
                            {r.attachmentIds.slice(0, 3).map((id: any) => (
                              <ProjectAttachmentChip key={id} id={Number(id)} onRemove={() => {}} />
                            ))}
                            {r.attachmentIds.length > 3 && (
                              <div className="text-xs text-slate-400 px-1">+{r.attachmentIds.length - 3} more…</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Attachments imported from Talent Bank */}
        <section id="section-attachments" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Talent Bank Attachments</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.attachments ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, attachments: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'attachments'}
                  onClick={() => saveSection('attachments')}
                >
                  {savingSection === 'attachments' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={openImportModal}
                disabled={isImporting || !sectionEdit.attachments}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : 'Import from Talent Bank'}
              </button>
            </div>
          </div>
          {sectionEdit.attachments && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.attachments.map((a) => String(a.id)), bulkSel.attachments)}
                  onChange={(e) => bulkSetAll('attachments', portfolio.attachments.map((a) => String(a.id)), e.target.checked)}
                  disabled={portfolio.attachments.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.attachments) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('attachments')}
              >
                Delete selected ({bulkCount(bulkSel.attachments)})
              </button>
            </div>
          )}

          {portfolio.attachments.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No attachments imported yet. Use “Import from Talent Bank” to select files.
            </p>
          ) : (
            <ul className="space-y-2">
              {portfolio.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 border border-white/10 rounded-xl p-3 bg-slate-900/40">
                  <div className="flex items-center gap-3 min-w-0">
                    {sectionEdit.attachments && (
                      <input
                        type="checkbox"
                        checked={!!bulkSel.attachments[String(a.id)]}
                        onChange={(e) => bulkToggleKey('attachments', String(a.id), e.target.checked)}
                      />
                    )}
                    {renderAttachmentThumb(a)}
                    <div className="min-w-0">
                      <div className="font-medium truncate text-white">{a.title}</div>
                      <div className="text-xs text-slate-400">
                        {a.item_type}
                        {a.file_type ? ` • ${a.file_type}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.url && (
                      <a className="text-blue-300 text-sm underline" href={a.url} target="_blank">
                        Open
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={!sectionEdit.attachments}
                      className="text-red-300 text-sm underline disabled:opacity-60"
                      onClick={() =>
                        setPortfolio((prev) => ({
                          ...prev,
                          attachments: prev.attachments.filter((x) => x.id !== a.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Projects */}
        <section id="section-projects" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Projects</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.projects ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, projects: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'projects'}
                  onClick={() => saveSection('projects')}
                >
                  {savingSection === 'projects' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={openProjectImportFromHeader}
                disabled={isImporting || !sectionEdit.projects}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : 'Import from Talent Bank'}
              </button>
              <button
                type="button"
                onClick={addProject}
                disabled={!sectionEdit.projects}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
              >
                Add Project
              </button>
            </div>
          </div>
          {sectionEdit.projects && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.projects.map((_, i) => String(i)), bulkSel.projects)}
                  onChange={(e) => bulkSetAll('projects', portfolio.projects.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.projects.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.projects) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('projects')}
              >
                Delete selected ({bulkCount(bulkSel.projects)})
              </button>
            </div>
          )}

          {portfolio.projects.length === 0 ? (
            <div className="text-sm text-slate-400">No projects added yet.</div>
          ) : (
            <div className="space-y-4">
              {portfolio.projects.map((p, index) => (
                <div key={index} className="p-4 border border-white/10 rounded-xl bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {sectionEdit.projects && (
                        <input
                          type="checkbox"
                          checked={!!bulkSel.projects[String(index)]}
                          onChange={(e) => bulkToggleKey('projects', String(index), e.target.checked)}
                        />
                      )}
                      <div className="text-sm font-semibold text-slate-200">Project {index + 1}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.projects}
                      className="text-xs text-red-300 underline disabled:opacity-60"
                      onClick={() => removeProject(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Project name"
                      value={p.name}
                      onChange={(e) => updateProject(index, 'name', e.target.value)}
                      disabled={!sectionEdit.projects}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      value={p.url}
                      onChange={(e) => updateProject(index, 'url', e.target.value)}
                      disabled={!sectionEdit.projects}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <div className="md:col-span-2">
                      <CollapsibleTextarea
                        value={p.description}
                        onChange={(e) => updateProject(index, 'description', e.target.value)}
                        placeholder="Description"
                        disabled={!sectionEdit.projects}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                        expandKey={`project-${index}`}
                        expanded={!!expandedTextareas[`project-${index}`]}
                        onToggle={toggleTextarea}
                        defaultRows={5}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Project files from Talent Bank: <span className="text-slate-200 font-semibold">{Array.isArray(p.attachmentIds) ? p.attachmentIds.length : 0}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.projects}
                      className="text-xs text-blue-300 underline disabled:opacity-60"
                      onClick={() => openProjectImportModal(index)}
                    >
                      Pick from Talent Bank
                    </button>
                  </div>

                  {Array.isArray(p.attachmentIds) && p.attachmentIds.length > 0 ? (
                    <div className="mt-3 grid md:grid-cols-2 gap-2">
                      {p.attachmentIds.slice(0, 6).map((id) => (
                        <ProjectAttachmentChip
                          key={id}
                          id={id}
                          onRemove={() => {
                            if (!sectionEdit.projects) return
                            setPortfolio((prev) => {
                              const updated = [...prev.projects]
                              const cur = updated[index]
                              if (!cur) return prev
                              const nextIds = (Array.isArray(cur.attachmentIds) ? cur.attachmentIds : []).filter((x) => x !== id)
                              updated[index] = { ...cur, attachmentIds: nextIds }
                              return { ...prev, projects: updated }
                            })
                          }}
                        />
                      ))}
                      {p.attachmentIds.length > 6 ? (
                        <div className="text-xs text-slate-400 px-2 py-2">+{p.attachmentIds.length - 6} more attached…</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Personal Documents */}
        <section id="section-personal-documents" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Personal Documents</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.personal_documents ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, personal_documents: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'personal_documents'}
                  onClick={() => saveSection('personal_documents')}
                >
                  {savingSection === 'personal_documents' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={openPersonalDocImportFromHeader}
                disabled={isImporting || !sectionEdit.personal_documents}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : 'Import from Talent Bank'}
              </button>
              <button
                type="button"
                onClick={addPersonalDocument}
                disabled={!sectionEdit.personal_documents}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
              >
                Add Document
              </button>
            </div>
          </div>
          {sectionEdit.personal_documents && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.personal_documents.map((_, i) => String(i)), bulkSel.personal_documents)}
                  onChange={(e) => bulkSetAll('personal_documents', portfolio.personal_documents.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.personal_documents.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.personal_documents) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('personal_documents')}
              >
                Delete selected ({bulkCount(bulkSel.personal_documents)})
              </button>
            </div>
          )}

          {portfolio.personal_documents.length === 0 ? (
            <div className="text-sm text-slate-400">No personal documents added yet.</div>
          ) : (
            <div className="space-y-4">
              {portfolio.personal_documents.map((doc, index) => (
                <div key={index} className="p-4 border border-white/10 rounded-xl bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {sectionEdit.personal_documents && (
                        <input
                          type="checkbox"
                          checked={!!bulkSel.personal_documents[String(index)]}
                          onChange={(e) => bulkToggleKey('personal_documents', String(index), e.target.checked)}
                        />
                      )}
                      <div className="text-sm font-semibold text-slate-200">Document {index + 1}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.personal_documents}
                      className="text-xs text-red-300 underline disabled:opacity-60"
                      onClick={() => removePersonalDocument(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Document title"
                      value={doc.title}
                      onChange={(e) => updatePersonalDocument(index, 'title', e.target.value)}
                      disabled={!sectionEdit.personal_documents}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <div className="md:col-span-2">
                      <CollapsibleTextarea
                        value={doc.description || ''}
                        onChange={(e) => updatePersonalDocument(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        disabled={!sectionEdit.personal_documents}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                        expandKey={`personal-doc-${index}`}
                        expanded={!!expandedTextareas[`personal-doc-${index}`]}
                        onToggle={toggleTextarea}
                        defaultRows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Attached files: <span className="text-slate-200 font-semibold">{Array.isArray(doc.attachmentIds) ? doc.attachmentIds.length : 0}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.personal_documents}
                      className="text-xs text-blue-300 underline disabled:opacity-60"
                      onClick={() => openPersonalDocImportModal(index)}
                    >
                      Pick from Talent Bank
                    </button>
                  </div>

                  {Array.isArray(doc.attachmentIds) && doc.attachmentIds.length > 0 ? (
                    <div className="mt-3 grid grid-cols-4 md:grid-cols-6 gap-2">
                      {doc.attachmentIds.map((id) => (
                        <DocumentAttachmentChip
                          key={id}
                          id={id}
                          onRemove={() => {
                            if (!sectionEdit.personal_documents) return
                            setPortfolio((prev) => {
                              const updated = [...prev.personal_documents]
                              const cur = updated[index]
                              if (!cur) return prev
                              const newIds = Array.isArray(cur.attachmentIds) ? cur.attachmentIds.filter((aid) => aid !== id) : []
                              updated[index] = { ...cur, attachmentIds: newIds }
                              return { ...prev, personal_documents: updated }
                            })
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Licences and Accreditations */}
        <section id="section-licences" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Licences and Accreditations</h2>
            <div className="flex items-center gap-3">
              {!sectionEdit.licences_accreditations ? (
                <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, licences_accreditations: true }))}>
                  Edit
                </button>
              ) : (
                <button
                  className="text-sm underline text-blue-300 disabled:opacity-60"
                  disabled={savingSection === 'licences_accreditations'}
                  onClick={() => saveSection('licences_accreditations')}
                >
                  {savingSection === 'licences_accreditations' ? 'Saving…' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={openLicenceImportFromHeader}
                disabled={isImporting || !sectionEdit.licences_accreditations}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
              >
                {isImporting ? 'Importing…' : 'Import from Talent Bank'}
              </button>
              <button
                type="button"
                onClick={addLicence}
                disabled={!sectionEdit.licences_accreditations}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60"
              >
                Add Licence/Accreditation
              </button>
            </div>
          </div>
          {sectionEdit.licences_accreditations && (
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bulkIsAllSelected(portfolio.licences_accreditations.map((_, i) => String(i)), bulkSel.licences_accreditations)}
                  onChange={(e) => bulkSetAll('licences_accreditations', portfolio.licences_accreditations.map((_, i) => String(i)), e.target.checked)}
                  disabled={portfolio.licences_accreditations.length === 0}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={bulkCount(bulkSel.licences_accreditations) === 0}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                onClick={() => bulkDeleteSelected('licences_accreditations')}
              >
                Delete selected ({bulkCount(bulkSel.licences_accreditations)})
              </button>
            </div>
          )}

          {portfolio.licences_accreditations.length === 0 ? (
            <div className="text-sm text-slate-400">No licences or accreditations added yet.</div>
          ) : (
            <div className="space-y-4">
              {portfolio.licences_accreditations.map((lic, index) => (
                <div key={index} className="p-4 border border-white/10 rounded-xl bg-slate-900/40">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {sectionEdit.licences_accreditations && (
                        <input
                          type="checkbox"
                          checked={!!bulkSel.licences_accreditations[String(index)]}
                          onChange={(e) => bulkToggleKey('licences_accreditations', String(index), e.target.checked)}
                        />
                      )}
                      <div className="text-sm font-semibold text-slate-200">Licence/Accreditation {index + 1}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.licences_accreditations}
                      className="text-xs text-red-300 underline disabled:opacity-60"
                      onClick={() => removeLicence(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {/* Title with autocomplete */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Title (start typing to search)"
                        value={lic.title}
                        onChange={(e) => {
                          updateLicence(index, 'title', e.target.value)
                          searchLicenceTitles(index, e.target.value)
                        }}
                        onFocus={() => {
                          if (lic.title && lic.title.length >= 2) {
                            searchLicenceTitles(index, lic.title)
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow clicks
                          setTimeout(() => setActiveTitleAutocompleteIndex(null), 200)
                        }}
                        disabled={!sectionEdit.licences_accreditations}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                      />
                      {activeTitleAutocompleteIndex === index && licenceTitleSuggestions[index] && licenceTitleSuggestions[index].length > 0 && (
                        <div 
                          ref={autocompleteRef}
                          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-auto"
                          onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
                        >
                          {licenceTitleSuggestions[index].map((suggestion, sugIndex) => (
                            <button
                              key={sugIndex}
                              type="button"
                              onClick={() => handleTitleSelect(index, suggestion)}
                              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white text-sm border-b border-slate-700 last:border-b-0"
                            >
                              <div className="font-medium">{suggestion.name}</div>
                              <div className="text-xs text-slate-400">{suggestion.jurisdiction}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Issuer with autocomplete */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Issuer (select title first)"
                        value={lic.issuer || ''}
                        onChange={(e) => handleIssuerInputChange(index, e.target.value)}
                        onFocus={() => {
                          // Show issuer suggestions if title is selected
                          if (lic.title) {
                            // If suggestions don't exist yet, try to load them
                            if (!licenceIssuerSuggestions[index] || licenceIssuerSuggestions[index].length === 0) {
                              // Re-query for issuer options based on current title
                              supabase
                                .from('licences_accreditations_reference')
                                .select('jurisdiction, issuing_authority')
                                .eq('name', lic.title)
                                .eq('is_active', true)
                                .then(({ data, error }) => {
                                  if (!error && data) {
                                    const issuerSet = new Set<string>()
                                    data.forEach(item => {
                                      if (item.issuing_authority && item.issuing_authority.trim()) {
                                        issuerSet.add(item.issuing_authority.trim())
                                      } else if (item.jurisdiction && item.jurisdiction.trim()) {
                                        issuerSet.add(item.jurisdiction.trim())
                                      }
                                    })
                                    const issuerOptions = Array.from(issuerSet).sort()
                                    if (issuerOptions.length > 0) {
                                      setLicenceIssuerSuggestions(prev => ({ ...prev, [index]: issuerOptions }))
                                      setActiveIssuerAutocompleteIndex(index)
                                    }
                                  }
                                })
                            } else {
                              setActiveIssuerAutocompleteIndex(index)
                            }
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding dropdown to allow clicks
                          setTimeout(() => setActiveIssuerAutocompleteIndex(null), 200)
                        }}
                        disabled={!sectionEdit.licences_accreditations || !lic.title}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                      />
                      {activeIssuerAutocompleteIndex === index && 
                       licenceIssuerSuggestions[index] && 
                       licenceIssuerSuggestions[index].length > 0 &&
                       lic.title && (
                        <div 
                          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-auto"
                          onMouseDown={(e) => e.preventDefault()} // Prevent input blur on click
                        >
                          {licenceIssuerSuggestions[index]
                            .filter(issuer => 
                              !lic.issuer || issuer.toLowerCase().includes(lic.issuer.toLowerCase())
                            )
                            .map((issuer, issIndex) => (
                            <button
                              key={issIndex}
                              type="button"
                              onClick={() => {
                                updateLicence(index, 'issuer', issuer)
                                setActiveIssuerAutocompleteIndex(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white text-sm border-b border-slate-700 last:border-b-0"
                            >
                              {issuer}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="date"
                      placeholder="Issue Date"
                      value={lic.issueDate || ''}
                      onChange={(e) => updateLicence(index, 'issueDate', e.target.value)}
                      disabled={!sectionEdit.licences_accreditations}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <input
                      type="date"
                      placeholder="Expiry Date"
                      value={lic.expiryDate || ''}
                      onChange={(e) => updateLicence(index, 'expiryDate', e.target.value)}
                      disabled={!sectionEdit.licences_accreditations}
                      className="p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                    />
                    <div className="md:col-span-2">
                      <CollapsibleTextarea
                        value={lic.description || ''}
                        onChange={(e) => updateLicence(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        disabled={!sectionEdit.licences_accreditations}
                        className="w-full p-3 rounded bg-slate-900 border border-slate-700 !text-white !placeholder:text-slate-500 disabled:opacity-60"
                        expandKey={`licence-${index}`}
                        expanded={!!expandedTextareas[`licence-${index}`]}
                        onToggle={toggleTextarea}
                        defaultRows={3}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Attached files: <span className="text-slate-200 font-semibold">{Array.isArray(lic.attachmentIds) ? lic.attachmentIds.length : 0}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!sectionEdit.licences_accreditations}
                      className="text-xs text-blue-300 underline disabled:opacity-60"
                      onClick={() => openLicenceImportModal(index)}
                    >
                      Pick from Talent Bank
                    </button>
                  </div>

                  {Array.isArray(lic.attachmentIds) && lic.attachmentIds.length > 0 ? (
                    <div className="mt-3 grid grid-cols-4 md:grid-cols-6 gap-2">
                      {lic.attachmentIds.map((id) => (
                        <DocumentAttachmentChip
                          key={id}
                          id={id}
                          onRemove={() => {
                            if (!sectionEdit.licences_accreditations) return
                            setPortfolio((prev) => {
                              const updated = [...prev.licences_accreditations]
                              const cur = updated[index]
                              if (!cur) return prev
                              const newIds = Array.isArray(cur.attachmentIds) ? cur.attachmentIds.filter((aid) => aid !== id) : []
                              updated[index] = { ...cur, attachmentIds: newIds }
                              return { ...prev, licences_accreditations: updated }
                            })
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Family and Community - Moved to bottom, collapsible */}
      <div className="max-w-4xl mx-auto px-8 pb-10">
        <section id="section-family-community" className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setFamilyCommunityExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-xl font-semibold hover:text-blue-300 transition-colors"
            >
              <span>{familyCommunityExpanded ? '▼' : '▶'}</span>
              <span>Family and Community</span>
            </button>
            <div className="flex items-center gap-3">
              {familyCommunityExpanded && (
                <>
                  {!sectionEdit.family_community ? (
                    <button className="text-sm underline text-blue-300" onClick={() => setSectionEdit((p) => ({ ...p, family_community: true }))}>
                      Edit
                    </button>
                  ) : (
                    <button
                      className="text-sm underline text-blue-300 disabled:opacity-60"
                      disabled={savingSection === 'family_community'}
                      onClick={() => saveSection('family_community')}
                    >
                      {savingSection === 'family_community' ? 'Saving…' : 'Save'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openFamilyCommunityImportModal}
                    disabled={isImporting || !sectionEdit.family_community}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-60"
                  >
                    {isImporting ? 'Importing…' : 'Import Images from Talent Bank'}
                  </button>
                </>
              )}
            </div>
          </div>

          {familyCommunityExpanded && (
            <>
              {sectionEdit.family_community && (
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-slate-300">
                    Selected images: {Array.isArray(portfolio.family_community?.imageIds) ? portfolio.family_community.imageIds.length : 0}
                  </div>
                  {Array.isArray(portfolio.family_community?.imageIds) && portfolio.family_community.imageIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPortfolio((prev) => ({ ...prev, family_community: { imageIds: [], descriptions: {} } }))}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}

              {!portfolio.family_community?.imageIds || portfolio.family_community.imageIds.length === 0 ? (
                <div className="text-sm text-slate-400">No images added yet. Click "Import Images from Talent Bank" to add images.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolio.family_community.imageIds.map((imageId) => {
                    const item = tbItemCache[imageId]
                    const path = item?.file_path || ''
                    const url = path ? thumbUrls[path] : null
                    const isImg = item?.file_type?.startsWith('image') || item?.item_type === 'image'
                    
                    // Load item if not in cache
                    if (!item) {
                      ensureTbItem(imageId).catch(() => {})
                    }
                    
                    // Load signed URL if needed
                    if (path && !url) {
                      ensureSignedUrl(path).catch(() => {})
                    }
                    
                    return (
                      <div key={imageId} className="relative aspect-square rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden group">
                        {sectionEdit.family_community && (
                          <button
                            type="button"
                            onClick={() => {
                              setPortfolio((prev) => {
                                const newImageIds = Array.isArray(prev.family_community?.imageIds)
                                  ? prev.family_community.imageIds.filter((id) => id !== imageId)
                                  : []
                                const newDescriptions = { ...(prev.family_community?.descriptions || {}) }
                                delete newDescriptions[imageId]
                                return {
                                  ...prev,
                                  family_community: {
                                    imageIds: newImageIds,
                                    descriptions: newDescriptions
                                  }
                                }
                              })
                            }}
                            className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs"
                          >
                            Remove
                          </button>
                        )}
                        {url && isImg ? (
                          <button
                            type="button"
                            onClick={() => {
                              setFamilyCommunityEditImage(imageId)
                              setFamilyCommunityEditDescription(portfolio.family_community?.descriptions?.[imageId] || '')
                            }}
                            className="w-full h-full"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={item.title || 'Family and Community Image'} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                            {item ? (
                              <div className="text-xs text-slate-400 text-center px-2">{item.title || `Image ${imageId}`}</div>
                            ) : (
                              <div className="text-xs text-slate-400">Loading...</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Layout - Moved to bottom, collapsible */}
      <div className="max-w-4xl mx-auto px-8 pb-10">
        <section className="border border-white/10 bg-slate-950/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setLayoutExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-xl font-semibold hover:text-blue-300 transition-colors"
            >
              <span>{layoutExpanded ? '▼' : '▶'}</span>
              <span>Layout (drag to reorder)</span>
            </button>
            {layoutExpanded && (
              <button type="button" className="text-sm underline text-blue-300" onClick={openIntroVideoModal}>
                Pick Intro Video
              </button>
            )}
          </div>
          {layoutExpanded && (
            <>
              <div className="text-xs text-slate-400 mb-3">
                Business users will see sections in this order. Keep the most important sections at the top.
              </div>
              <ul className="space-y-2">
                {(Array.isArray(portfolio.sectionOrder) ? portfolio.sectionOrder : []).map((k, idx) => (
                  <li
                    key={`${k}-${idx}`}
                    draggable
                    onDragStart={() => setLayoutDragIndex(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (layoutDragIndex == null) return
                      moveSection(layoutDragIndex, idx)
                      setLayoutDragIndex(null)
                    }}
                    className="border border-white/10 rounded-xl p-3 bg-slate-900/40 flex items-center justify-between gap-3 cursor-move"
                    title="Drag to reorder"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg border border-white/10 bg-slate-900 flex items-center justify-center text-xs font-semibold">
                        ↕
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold capitalize">{k === 'intro' ? 'Talent Introduction' : k}</div>
                        <div className="text-xs text-slate-400">
                          {k === 'intro'
                            ? 'Optional: video introduction near the start'
                            : k === 'attachments'
                              ? 'Talent Bank items in portfolio'
                              : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs disabled:opacity-50"
                        onClick={() => moveSection(idx, idx - 1)}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={idx === (portfolio.sectionOrder?.length ?? 0) - 1}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs disabled:opacity-50"
                        onClick={() => moveSection(idx, idx + 1)}
                      >
                        Down
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Import from Talent Bank</div>
              <button className="text-sm underline" onClick={() => setImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {renderUploadUI({
              onSuccess: openImportModal,
            })}

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No Talent Bank items found.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[item.id]}
                          onChange={(e) =>
                            setSelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setImportOpen(false)}>
                Cancel
              </button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={applyImport} disabled={!Object.values(selectedIds).some(Boolean)}>
                Import selected
          </button>
        </div>
      </div>
        </div>
      )}

      {/* Project import modal */}
      {projectImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setProjectImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Pick Project Files (from Talent Bank)</div>
              <button className="text-sm underline" onClick={() => setProjectImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {renderUploadUI({
              onSuccess: async () => {
                if (activeProjectIndex !== null) {
                  await openProjectImportModal(activeProjectIndex)
                }
              },
            })}

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No Talent Bank files found.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!projectSelectedIds[item.id]}
                          onChange={(e) =>
                            setProjectSelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setProjectImportOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                onClick={applyProjectImport}
                disabled={!Object.values(projectSelectedIds).some(Boolean)}
              >
                Apply to Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Education import modal */}
      {educationImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setEducationImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Pick Degree Document (from Talent Bank)</div>
              <button className="text-sm underline" onClick={() => setEducationImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {renderUploadUI({
              onSuccess: async () => {
                if (activeEducationIndex !== null) {
                  await openEducationImportModal(activeEducationIndex)
                }
              },
            })}

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No Talent Bank files found.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!educationSelectedIds[item.id]}
                          onChange={(e) =>
                            setEducationSelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setEducationImportOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                onClick={applyEducationImport}
                disabled={!Object.values(educationSelectedIds).some(Boolean)}
              >
                Apply to Education
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referee import modal */}
      {refereeImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setRefereeImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Pick Referee Document (from Talent Bank)</div>
              <button className="text-sm underline" onClick={() => setRefereeImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {renderUploadUI({
              onSuccess: async () => {
                if (activeRefereeIndex !== null) {
                  await openRefereeImportModal(activeRefereeIndex)
                }
              },
            })}

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No Talent Bank files found.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!refereeSelectedIds[item.id]}
                          onChange={(e) =>
                            setRefereeSelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setRefereeImportOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                onClick={applyRefereeImport}
                disabled={!Object.values(refereeSelectedIds).some(Boolean)}
              >
                Apply to Referee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Configuration Section */}
      {talentProfileId && userId && (
        <div className="mt-8">
          <PortfolioShareConfig
            talentProfileId={talentProfileId}
            userId={userId}
            avatarPath={portfolio.avatar_path}
            bannerPath={portfolio.banner_path}
            introVideoId={portfolio.introVideoId}
            onConfigChange={(config) => setShareConfig(config)}
          />
        </div>
      )}



      {/* Intro video modal */}
      {introModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setIntroModalOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Select Talent Introduction Video</div>
              <button className="text-sm underline" onClick={() => setIntroModalOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded max-h-[55vh] overflow-auto">
                {introItems.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">No video items found in Talent Bank yet.</div>
                ) : (
                  <ul className="divide-y">
                    {introItems.map((item) => (
                      <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="introVideo"
                            checked={introPickId === item.id}
                            onChange={async () => {
                              setIntroPickId(item.id)
                              if (item.file_path) {
                                const { data: urlData } = await supabase.storage.from('talent-bank').createSignedUrl(item.file_path, 60 * 30)
                                setIntroPreviewUrl(urlData?.signedUrl ?? null)
                              }
                            }}
                          />
                          {renderImportThumb(item)}
                          <div className="min-w-0">
                            <div className="font-medium truncate">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.file_type || item.item_type}</div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border rounded bg-black flex items-center justify-center min-h-[240px]">
                {introPreviewUrl ? (
                  <video src={introPreviewUrl} controls className="w-full max-h-[55vh] object-contain" />
                ) : (
                  <div className="text-sm text-gray-500 p-6">Select a video to preview.</div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                className="text-sm underline text-gray-700"
                onClick={() => {
                  setIntroPickId(null)
                  setIntroPreviewUrl(null)
                  setPortfolio((prev) => ({ ...prev, introVideoId: null }))
                  log('intro video cleared', 'P_LAYOUT', {}).catch(() => {})
                }}
              >
                Clear intro video
              </button>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded border" onClick={() => setIntroModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                  onClick={applyIntroVideo}
                  disabled={!introPickId}
                >
                  Use as Intro Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Documents import modal */}
      {personalDocImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setPersonalDocImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Pick Document Files (from Talent Bank)</div>
              <button className="text-sm underline" onClick={() => setPersonalDocImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {renderUploadUI({
              onSuccess: async () => {
                if (activePersonalDocIndex !== null) {
                  await openPersonalDocImportModal(activePersonalDocIndex)
                }
              },
            })}

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No Talent Bank files found.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!personalDocSelectedIds[item.id]}
                          onChange={(e) =>
                            setPersonalDocSelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setPersonalDocImportOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                onClick={applyPersonalDocImport}
                disabled={!Object.values(personalDocSelectedIds).some(Boolean)}
              >
                Apply to Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family and Community import modal */}
      {familyCommunityImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setFamilyCommunityImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Pick Family and Community Images (from Talent Bank)</div>
              <button className="text-sm underline" onClick={() => setFamilyCommunityImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {/* Upload options */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Add images not in Talent Bank:</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={familyCommunityFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadFamilyCommunityFile(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => familyCommunityFileInputRef.current?.click()}
                  disabled={familyCommunityUploading || isImporting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {familyCommunityUploading ? 'Uploading...' : '📤 Upload from Computer'}
                </button>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={familyCommunityUploadUrl}
                    onChange={(e) => setFamilyCommunityUploadUrl(e.target.value)}
                    placeholder="Paste image URL here..."
                    disabled={familyCommunityUploading || isImporting}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-60"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !familyCommunityUploading && !isImporting) {
                        addFamilyCommunityFromUrl()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addFamilyCommunityFromUrl}
                    disabled={familyCommunityUploading || isImporting || !familyCommunityUploadUrl.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                  >
                    {familyCommunityUploading ? 'Adding...' : '🔗 Add from URL'}
                  </button>
                </div>
              </div>
            </div>

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No image files found in Talent Bank.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!familyCommunitySelectedIds[item.id]}
                          onChange={(e) =>
                            setFamilyCommunitySelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setFamilyCommunityImportOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                onClick={applyFamilyCommunityImport}
                disabled={!Object.values(familyCommunitySelectedIds).some(Boolean)}
              >
                Apply to Family and Community
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family and Community image edit modal */}
      {familyCommunityEditImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => {
            setFamilyCommunityEditImage(null)
            setFamilyCommunityEditDescription('')
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-xl font-semibold">Edit Image Description</div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                onClick={() => {
                  setFamilyCommunityEditImage(null)
                  setFamilyCommunityEditDescription('')
                }}
              >
                Close
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const item = tbItemCache[familyCommunityEditImage]
                const path = item?.file_path || ''
                const url = path ? thumbUrls[path] : null
                if (path && !url) ensureSignedUrl(path).catch(() => {})
                
                return (
                  <div className="space-y-4">
                    <div className="flex justify-center bg-black p-4 rounded-lg">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={item?.title || 'Family and Community Image'}
                          className="max-h-[50vh] w-auto object-contain"
                        />
                      ) : (
                        <div className="text-white p-8">Loading image...</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <CollapsibleTextarea
                        value={familyCommunityEditDescription}
                        onChange={(e) => setFamilyCommunityEditDescription(e.target.value)}
                        placeholder="Explain what this image is about..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] text-gray-900"
                        expandKey={`family-community-modal-${familyCommunityEditImage}`}
                        expanded={!!expandedTextareas[`family-community-modal-${familyCommunityEditImage}`]}
                        onToggle={toggleTextarea}
                        defaultRows={5}
                        disabled={false}
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        Add a description to explain what this image shows about your family life, community involvement, volunteering, etc.
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        onClick={() => {
                          setFamilyCommunityEditImage(null)
                          setFamilyCommunityEditDescription('')
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                        onClick={() => {
                          if (familyCommunityEditImage !== null) {
                            setPortfolio((prev) => ({
                              ...prev,
                              family_community: {
                                imageIds: prev.family_community?.imageIds || [],
                                descriptions: {
                                  ...(prev.family_community?.descriptions || {}),
                                  [familyCommunityEditImage]: familyCommunityEditDescription.trim()
                                }
                              }
                            }))
                          }
                          setFamilyCommunityEditImage(null)
                          setFamilyCommunityEditDescription('')
                        }}
                      >
                        Save Description
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Licences and Accreditations import modal */}
      {licenceImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setLicenceImportOpen(false)}>
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Pick Licence/Accreditation Files (from Talent Bank)</div>
              <button className="text-sm underline" onClick={() => setLicenceImportOpen(false)}>Close</button>
            </div>

            {importError && (
              <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
                {importError}
              </div>
            )}

            {renderUploadUI({
              onSuccess: async () => {
                if (activeLicenceIndex !== null) {
                  await openLicenceImportModal(activeLicenceIndex)
                }
              },
            })}

            <div className="border rounded max-h-[60vh] overflow-auto">
              {availableItems.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No Talent Bank files found.</div>
              ) : (
                <ul className="divide-y">
                  {availableItems.map((item) => (
                    <li key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={!!licenceSelectedIds[item.id]}
                          onChange={(e) =>
                            setLicenceSelectedIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                        />
                        {renderImportThumb(item)}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 mr-2">
                              {item.item_type}
                            </span>
                            <span className="text-gray-600">{itemSummary(item)}</span>
                          </div>
                        </div>
                      </label>
                      <div className="text-xs text-gray-400 shrink-0">
                        {item.file_type || ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setLicenceImportOpen(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                onClick={applyLicenceImport}
                disabled={!Object.values(licenceSelectedIds).some(Boolean)}
              >
                Apply to Licence/Accreditation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



