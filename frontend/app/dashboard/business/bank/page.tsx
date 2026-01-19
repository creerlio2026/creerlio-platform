'use client'

import { useEffect, useRef, useState, DragEvent, ChangeEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface BusinessBankItem {
  id: number
  user_id: string
  item_type: string
  title: string
  description?: string | null
  file_url?: string | null
  file_path?: string | null
  file_type?: string | null
  file_size?: number | null
  metadata?: any
  created_at: string
}

type ItemFilter = 'all' | 'image' | 'video' | 'text' | 'link' | 'logo' | 'business_introduction'

const BUCKET = 'business-bank'
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

export default function BusinessBankPage() {
  const router = useRouter()
  const [items, setItems] = useState<BusinessBankItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [filter, setFilter] = useState<ItemFilter>('all')
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<
    | { kind: 'image'; url: string; title: string }
    | { kind: 'video'; url: string; title: string }
    | null
  >(null)

  // Link form
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDescription, setLinkDescription] = useState('')

  // Business Introduction form
  const [introVideoUrl, setIntroVideoUrl] = useState('')
  const [introVideoTitle, setIntroVideoTitle] = useState('Business Introduction Video')
  const [introVideoSource, setIntroVideoSource] = useState<'record' | 'upload' | 'link'>('link')

  // Video recording state
  const [recOpen, setRecOpen] = useState(false)
  const [recBusy, setRecBusy] = useState(false)
  const [recErr, setRecErr] = useState<string | null>(null)
  const [recStream, setRecStream] = useState<MediaStream | null>(null)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [recChunks, setRecChunks] = useState<BlobPart[]>([])
  const recChunksRef = useRef<BlobPart[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recPreviewUrl, setRecPreviewUrl] = useState<string | null>(null)
  const [recMime, setRecMime] = useState<string>('video/webm')
  const liveVideoRef = useRef<HTMLVideoElement | null>(null)
  const videoFileInputRef = useRef<HTMLInputElement>(null)

  const [editEntry, setEditEntry] = useState<null | { item: BusinessBankItem; draft: any }>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadItems()
  }, [filter])

  async function loadItems() {
    try {
      setIsLoading(true)
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes.session?.user?.id

      if (!uid) {
        router.replace('/login?redirect=/dashboard/business/bank')
        return
      }

      setUserId(uid)

      let query = supabase
        .from('business_bank_items')
        .select('*')
        .eq('user_id', uid)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('item_type', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setItems(data || [])

      // Load thumbnails for images and videos (including business_introduction)
      const mediaItems = (data || []).filter(
        (item) => item.item_type === 'image' || item.item_type === 'video' || item.item_type === 'business_introduction'
      )
      const thumbMap: Record<string, string> = {}
      for (const item of mediaItems) {
        if (item.file_path) {
          const { data: urlData } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(item.file_path, 3600)
          if (urlData) {
            thumbMap[String(item.id)] = urlData.signedUrl
          }
        } else if (item.file_url) {
          thumbMap[String(item.id)] = item.file_url
        }
      }
      setThumbUrls(thumbMap)
    } catch (err: any) {
      console.error('Error loading items:', err)
      setUploadError(err.message || 'Failed to load items')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !userId) return

    setIsUploading(true)
    setUploadError(null)

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setUploadError(`File ${file.name} exceeds maximum size of 50MB`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        // Path structure: business/{user_id}/{filename}
        // Using user_id directly as business identifier (matches business_profiles.user_id)
        const fileName = `business/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = fileName

        // Determine item type
        let itemType = 'image'
        if (file.type.startsWith('video/')) {
          itemType = 'video'
        } else if (file.type === 'image/svg+xml' || file.name.toLowerCase().includes('logo')) {
          itemType = 'logo'
        }

        // Upload to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('Storage upload error details:', {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError,
            filePath: filePath,
            userId: userId,
          })
          // If it's an RLS error, provide helpful message
          if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy') || uploadError.statusCode === 403) {
            throw new Error('Storage upload failed: RLS policy error. Please run FIX_STORAGE_RLS_BUSINESS_BANK.sql in Supabase SQL Editor.')
          }
          throw new Error(uploadError.message || `Storage upload failed: ${uploadError.statusCode || 'Unknown error'}`)
        }

        // Get public URL (or signed URL if bucket is private)
        let fileUrl: string | null = null
        if (uploadData?.path) {
          // Try to get public URL first (works if bucket is public)
          const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
          if (publicUrlData?.publicUrl) {
            fileUrl = publicUrlData.publicUrl
          } else {
            // For private buckets, use the path directly (Supabase will handle auth)
            // Or create a signed URL if needed for immediate access
            try {
              const { data: urlData, error: signError } = await supabase.storage
                .from(BUCKET)
                .createSignedUrl(uploadData.path, 31536000) // 1 year
              if (signError) {
                console.warn('Could not create signed URL, using path:', signError)
                // Use path-based URL that will be resolved by Supabase client
                fileUrl = `${BUCKET}/${uploadData.path}`
              } else {
                fileUrl = urlData?.signedUrl || null
              }
            } catch (signErr) {
              console.warn('Signed URL creation failed, using path:', signErr)
              fileUrl = `${BUCKET}/${uploadData.path}`
            }
          }
        }

        // Create database record
        const { error: dbError, data: dbData } = await supabase.from('business_bank_items').insert({
          user_id: userId,
          item_type: itemType,
          title: file.name,
          file_path: filePath,
          file_url: fileUrl,
          file_type: file.type,
          file_size: file.size,
          metadata: {
            originalName: file.name,
          },
        }).select()

        if (dbError) {
          console.error('Database insert error details:', {
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint,
            code: dbError.code,
          })
          // If DB insert fails, try to clean up the uploaded file
          if (uploadData?.path) {
            try {
              await supabase.storage.from(BUCKET).remove([uploadData.path])
            } catch (cleanupErr) {
              console.error('Failed to cleanup uploaded file:', cleanupErr)
            }
          }
          throw new Error(dbError.message || dbError.details || 'Failed to save file record to database')
        }
      }

      await loadItems()
      setUploadError(null) // Clear any previous errors on success
    } catch (err: any) {
      console.error('Upload error details:', {
        message: err.message,
        error: err,
        stack: err.stack,
      })
      setUploadError(err.message || err.details || 'Upload failed. Check console for details.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleLinkCreate() {
    if (!linkTitle.trim() || !linkUrl.trim() || !userId) {
      setUploadError('Title and URL are required')
      return
    }

    try {
      const { error } = await supabase.from('business_bank_items').insert({
        user_id: userId,
        item_type: 'link',
        title: linkTitle,
        description: linkDescription || null,
        file_url: linkUrl,
        metadata: {
          url: linkUrl,
        },
      })

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      // Reset form immediately after successful creation
      setLinkTitle('')
      setLinkUrl('')
      setLinkDescription('')
      setUploadError(null)
      await loadItems()
    } catch (err: any) {
      console.error('Error creating link:', err)
      setUploadError(err.message || err.details || 'Failed to create link')
    }
  }

  // Video recording functions
  function chooseRecorderMime() {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported?.(c)) return c
    }
    return 'video/webm'
  }

  async function startCamera() {
    setRecErr(null)
    setRecBusy(true)
    try {
      if (typeof window !== 'undefined' && !(window as any).isSecureContext) {
        setRecErr('Camera access requires a secure connection (HTTPS) or localhost.')
        return
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setRecErr('Camera recording is not supported in this browser.')
        return
      }

      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (e: any) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }
      setRecStream(stream)
      const mime = chooseRecorderMime()
      setRecMime(mime)
    } catch (e: any) {
      const name = e?.name ?? null
      const msg =
        name === 'NotAllowedError'
          ? 'Permission denied. Please allow camera + microphone access for this site.'
          : (e?.message ?? 'Failed to access camera/microphone.')
      setRecErr(msg)
    } finally {
      setRecBusy(false)
    }
  }

  async function beginRecording() {
    setRecErr(null)
    if (!recStream) {
      await startCamera()
      return
    }
    try {
      if (typeof MediaRecorder === 'undefined') {
        setRecErr('Video recording is not supported in this browser.')
        return
      }
      if (recPreviewUrl) {
        try { URL.revokeObjectURL(recPreviewUrl) } catch {}
        setRecPreviewUrl(null)
      }
      setRecChunks([])
      recChunksRef.current = []

      const preferred = chooseRecorderMime()
      const candidates = Array.from(new Set([preferred, 'video/webm;codecs=vp8,opus', 'video/webm']))

      let chosen: string | null = null
      let mr: MediaRecorder | null = null

      const attachHandlers = (rec: MediaRecorder, mimeForBlob: string) => {
        rec.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            recChunksRef.current = [...recChunksRef.current, ev.data]
            setRecChunks(recChunksRef.current)
          }
        }
        rec.onstop = () => {
          const blob = new Blob(recChunksRef.current, { type: mimeForBlob })
          if (recPreviewUrl) {
            try { URL.revokeObjectURL(recPreviewUrl) } catch {}
          }
          const url = URL.createObjectURL(blob)
          setRecPreviewUrl(url)
        }
      }

      for (const c of candidates) {
        try {
          const rec = new MediaRecorder(recStream, { mimeType: c } as any)
          attachHandlers(rec, c)
          rec.start(250)
          mr = rec
          chosen = c
          break
        } catch (e: any) {
          // Try next codec
        }
      }

      if (!mr) {
        try {
          const rec = new MediaRecorder(recStream)
          const fallbackMime = (rec as any)?.mimeType || 'video/webm'
          attachHandlers(rec, fallbackMime)
          rec.start(250)
          mr = rec
          chosen = fallbackMime
        } catch (e: any) {
          try {
            const videoOnly = new MediaStream(recStream.getVideoTracks())
            const rec2 = new MediaRecorder(videoOnly)
            const fallbackMime2 = (rec2 as any)?.mimeType || 'video/webm'
            attachHandlers(rec2, fallbackMime2)
            rec2.start(250)
            mr = rec2
            chosen = fallbackMime2
          } catch (e2: any) {
            setRecErr('Recording is not supported by this browser/device.')
            return
          }
        }
      }

      setRecMime(chosen || preferred)
      setRecorder(mr)
      setIsRecording(true)
    } catch (e: any) {
      setRecErr(e?.message ?? 'Failed to start recording.')
    }
  }

  async function stopRecording() {
    try { recorder?.stop() } catch {}
    setIsRecording(false)
    setRecorder(null)
  }

  function clearRecording() {
    try {
      if (recStream) recStream.getTracks().forEach((t) => t.stop())
      if (recPreviewUrl) URL.revokeObjectURL(recPreviewUrl)
    } catch {}
    setRecStream(null)
    setRecPreviewUrl(null)
    setRecChunks([])
    recChunksRef.current = []
  }

  async function uploadRecordedVideo() {
    setRecErr(null)
    if (!userId) {
      setUploadError('Please sign in to upload video.')
      return
    }

    const blob = new Blob(recChunksRef.current, { type: recMime })
    if (!blob.size) {
      setRecErr('No recording captured yet.')
      return
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
      const sizeMb = Math.round((blob.size / (1024 * 1024)) * 10) / 10
      const limitMb = Math.round((MAX_UPLOAD_BYTES / (1024 * 1024)) * 10) / 10
      setRecErr(`Recording is ${sizeMb}MB, which exceeds the upload limit (~${limitMb}MB). Please record a shorter video.`)
      return
    }

    const ext = recMime.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([blob], `business-intro-${Date.now()}.${ext}`, { type: recMime })

    setIsUploading(true)
    try {
      const fileExt = ext
      const fileName = `business/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'Storage upload failed')
      }

      let fileUrl: string | null = null
      if (uploadData?.path) {
        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl
        } else {
          try {
            const { data: urlData } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(uploadData.path, 31536000)
            fileUrl = urlData?.signedUrl || null
          } catch {
            fileUrl = `${BUCKET}/${uploadData.path}`
          }
        }
      }

      console.log('[Business Bank] Inserting recorded video:', {
        user_id: userId,
        item_type: 'business_introduction',
        title: introVideoTitle || 'Business Introduction Video',
        file_path: filePath,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
      })

      const { error: dbError, data: dbData } = await supabase
        .from('business_bank_items')
        .insert({
          user_id: userId,
          item_type: 'business_introduction',
          title: introVideoTitle || 'Business Introduction Video',
          file_path: filePath,
          file_url: fileUrl,
          file_type: file.type,
          file_size: file.size,
          metadata: {
            originalName: file.name,
            source: 'recording',
          },
        })
        .select()

      if (dbError) {
        console.error('[Business Bank] Database error:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
        })
        
        if (uploadData?.path) {
          await supabase.storage.from(BUCKET).remove([uploadData.path])
        }
        
        // Check for constraint violation
        if (dbError.message?.includes('check constraint') || dbError.message?.includes('business_bank_items_item_type_check')) {
          throw new Error(
            'The item type "business_introduction" is not allowed. Please run FIX_BUSINESS_BANK_ITEM_TYPE_CONSTRAINT.sql in Supabase SQL Editor to enable this type.'
          )
        } else {
          throw new Error(dbError.message || dbError.details || 'Failed to save video record')
        }
      }

      console.log('[Business Bank] Recorded video inserted successfully:', dbData)

      console.log('[Business Bank] Recorded video inserted successfully')

      clearRecording()
      setRecOpen(false)
      setIntroVideoTitle('Business Introduction Video')
      setUploadError(null)
      await loadItems()
      
      // Show success message
      alert('Video recorded and saved successfully!')
    } catch (err: any) {
      setRecErr(err.message || 'Failed to upload video')
      setUploadError(err.message || 'Failed to upload video')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleIntroVideoUpload(files: FileList | null) {
    if (!files || files.length === 0 || !userId) return

    const file = files[0]
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file.')
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10
      const limitMb = Math.round((MAX_UPLOAD_BYTES / (1024 * 1024)) * 10) / 10
      setUploadError(`File is ${sizeMb}MB, which exceeds the upload limit (~${limitMb}MB).`)
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `business/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'Storage upload failed')
      }

      let fileUrl: string | null = null
      if (uploadData?.path) {
        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path)
        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl
        } else {
          try {
            const { data: urlData } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(uploadData.path, 31536000)
            fileUrl = urlData?.signedUrl || null
          } catch {
            fileUrl = `${BUCKET}/${uploadData.path}`
          }
        }
      }

      console.log('[Business Bank] Inserting video file:', {
        user_id: userId,
        item_type: 'business_introduction',
        title: introVideoTitle || 'Business Introduction Video',
        file_path: filePath,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
      })

      const { error: dbError, data: dbData } = await supabase
        .from('business_bank_items')
        .insert({
          user_id: userId,
          item_type: 'business_introduction',
          title: introVideoTitle || 'Business Introduction Video',
          file_path: filePath,
          file_url: fileUrl,
          file_type: file.type,
          file_size: file.size,
          metadata: {
            originalName: file.name,
            source: 'upload',
          },
        })
        .select()

      if (dbError) {
        console.error('[Business Bank] Database error:', {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
        })
        
        if (uploadData?.path) {
          await supabase.storage.from(BUCKET).remove([uploadData.path])
        }
        
        // Check for constraint violation
        if (dbError.message?.includes('check constraint') || dbError.message?.includes('business_bank_items_item_type_check')) {
          throw new Error(
            'The item type "business_introduction" is not allowed. Please run FIX_BUSINESS_BANK_ITEM_TYPE_CONSTRAINT.sql in Supabase SQL Editor to enable this type.'
          )
        } else {
          throw new Error(dbError.message || dbError.details || 'Failed to save video record')
        }
      }

      console.log('[Business Bank] Video file inserted successfully:', dbData)

      setIntroVideoTitle('Business Introduction Video')
      setUploadError(null)
      await loadItems()
      
      // Show success message
      alert('Video uploaded successfully!')
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload video')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleIntroVideoLink() {
    if (!introVideoUrl.trim() || !userId) {
      setUploadError('Please enter a video URL')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Validate URL
      try {
        new URL(introVideoUrl)
      } catch {
        setUploadError('Please enter a valid URL')
        setIsUploading(false)
        return
      }

      console.log('[Business Bank] Inserting video link:', {
        user_id: userId,
        item_type: 'business_introduction',
        title: introVideoTitle || 'Business Introduction Video',
        file_url: introVideoUrl,
      })

      const { error, data } = await supabase
        .from('business_bank_items')
        .insert({
          user_id: userId,
          item_type: 'business_introduction',
          title: introVideoTitle || 'Business Introduction Video',
          file_url: introVideoUrl,
          metadata: {
            url: introVideoUrl,
            source: 'link',
          },
        })
        .select()

      if (error) {
        console.error('[Business Bank] Database error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        
        // Check for constraint violation
        if (error.message?.includes('check constraint') || error.message?.includes('business_bank_items_item_type_check')) {
          setUploadError(
            'The item type "business_introduction" is not allowed. Please run FIX_BUSINESS_BANK_ITEM_TYPE_CONSTRAINT.sql in Supabase SQL Editor to enable this type.'
          )
        } else {
          setUploadError(error.message || error.details || 'Failed to create video link')
        }
        setIsUploading(false)
        return
      }

      console.log('[Business Bank] Video link inserted successfully:', data)

      setIntroVideoUrl('')
      setIntroVideoTitle('Business Introduction Video')
      setUploadError(null)
      await loadItems()
      
      // Show success message
      alert('Video link added successfully!')
    } catch (err: any) {
      console.error('[Business Bank] Error creating video link:', err)
      setUploadError(err.message || err.details || 'Failed to create video link')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const item = items.find((i) => i.id === id)
      if (item?.file_path) {
        await supabase.storage.from(BUCKET).remove([item.file_path])
      }

      const { error } = await supabase
        .from('business_bank_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadItems()
    } catch (err: any) {
      console.error('Error deleting item:', err)
      setUploadError(err.message || 'Failed to delete item')
    }
  }

  function handleDrag(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const filteredItems = items.filter((item) => filter === 'all' || item.item_type === filter)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/business"
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard/business/edit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Business Bank</h1>
          <p className="text-gray-400">
            Store images, videos, and links for your business profile
          </p>
        </div>

        {uploadError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-lg">
            {uploadError}
            <button
              onClick={() => setUploadError(null)}
              className="ml-4 text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-700">
          {(['all', 'image', 'video', 'text', 'link', 'logo', 'business_introduction'] as ItemFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === f
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {f === 'business_introduction' ? 'Business Introduction' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-2 text-sm text-gray-500">
                  ({items.filter((i) => i.item_type === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div
          ref={dropRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-8 p-8 border-2 border-dashed rounded-lg transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
          }`}
        >
          <div className="text-center">
            <p className="text-gray-300 mb-4">Drag and drop files here, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>

        {/* Business Introduction Video */}
        <div className="mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Business Introduction Video</h3>
          <p className="text-sm text-gray-400 mb-4">
            Record a video, upload a file, or link to a video from YouTube, your website, or other platforms.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                placeholder="Business Introduction Video"
                value={introVideoTitle}
                onChange={(e) => setIntroVideoTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setIntroVideoSource('link')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    introVideoSource === 'link'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Link Video
                </button>
                <button
                  type="button"
                  onClick={() => setIntroVideoSource('upload')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    introVideoSource === 'upload'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntroVideoSource('record')
                    setRecOpen(true)
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    introVideoSource === 'record'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Record Video
                </button>
              </div>
            </div>

            {introVideoSource === 'link' && (
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="Video URL (YouTube, Vimeo, or direct video link)"
                  value={introVideoUrl}
                  onChange={(e) => setIntroVideoUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
                <button
                  onClick={handleIntroVideoLink}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Saving...' : 'Add Video Link'}
                </button>
              </div>
            )}

            {introVideoSource === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleIntroVideoUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => videoFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Choose Video File'}
                </button>
              </div>
            )}

            {introVideoSource === 'record' && (
              <div className="space-y-4">
                <button
                  onClick={() => setRecOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Open Camera
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Link */}
        <div className="mb-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add Link</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title (e.g., Company Website)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
            />
            <input
              type="url"
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
            />
            <textarea
              placeholder="Description (optional)"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
            />
            <button
              onClick={handleLinkCreate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Link
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No items found. Upload files to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
              >
                {(item.item_type === 'image' || item.item_type === 'logo') && thumbUrls[item.id] && (
                  <div
                    className="aspect-video bg-gray-900 cursor-pointer"
                    onClick={() =>
                      setPreview({
                        kind: 'image',
                        url: thumbUrls[item.id],
                        title: item.title,
                      })
                    }
                  >
                    <img
                      src={thumbUrls[item.id]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {(item.item_type === 'video' || item.item_type === 'business_introduction') && thumbUrls[item.id] && (
                  <div
                    className="aspect-video bg-gray-900 cursor-pointer relative"
                    onClick={() =>
                      setPreview({
                        kind: 'video',
                        url: thumbUrls[item.id],
                        title: item.title,
                      })
                    }
                  >
                    <img
                      src={thumbUrls[item.id]}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                {(item.item_type === 'video' || item.item_type === 'business_introduction') && !thumbUrls[item.id] && item.file_url && (
                  <div
                    className="aspect-video bg-gray-900 cursor-pointer relative"
                    onClick={() =>
                      setPreview({
                        kind: 'video',
                        url: item.file_url!,
                        title: item.title,
                      })
                    }
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                {(item.item_type === 'text' || item.item_type === 'link') && (
                  <div className="aspect-video bg-gray-900 flex items-center justify-center p-4">
                    <div className="text-center">
                      {item.item_type === 'link' ? (
                        <svg
                          className="w-12 h-12 text-gray-600 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-12 h-12 text-gray-600 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                      <p className="text-xs text-gray-500 uppercase">{item.item_type}</p>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 truncate">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-4xl w-full">
            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
            {preview.kind === 'image' ? (
              <img src={preview.url} alt={preview.title} className="w-full h-auto rounded-lg" />
            ) : (
              <video
                src={preview.url}
                controls
                className="w-full h-auto rounded-lg"
                autoPlay
              />
            )}
            <p className="text-white text-center mt-4">{preview.title}</p>
          </div>
        </div>
      )}

      {/* Video Recording Modal */}
      {recOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isRecording) {
              clearRecording()
              setRecOpen(false)
            }
          }}
        >
          <div
            className="max-w-3xl w-full bg-gray-900 rounded-lg border border-gray-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Record Business Introduction Video</h3>
              <button
                onClick={() => {
                  if (!isRecording) {
                    clearRecording()
                    setRecOpen(false)
                  }
                }}
                disabled={isRecording}
                className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {recErr && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-lg text-sm">
                {recErr}
              </div>
            )}

            {!recStream && !recPreviewUrl && (
              <div className="space-y-4">
                <p className="text-gray-300">
                  Click "Start Camera" to begin recording your business introduction video.
                </p>
                <button
                  onClick={startCamera}
                  disabled={recBusy}
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-semibold"
                >
                  {recBusy ? 'Starting Camera...' : 'Start Camera'}
                </button>
              </div>
            )}

            {recStream && !recPreviewUrl && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[400px] object-contain"
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">Recording</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center">
                  {!isRecording ? (
                    <button
                      onClick={beginRecording}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                    >
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                    >
                      Stop Recording
                    </button>
                  )}
                  <button
                    onClick={clearRecording}
                    disabled={isRecording}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {recPreviewUrl && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    src={recPreviewUrl}
                    controls
                    className="w-full max-h-[400px] object-contain"
                  />
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={uploadRecordedVideo}
                    disabled={isUploading}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-semibold"
                  >
                    {isUploading ? 'Uploading...' : 'Save Video'}
                  </button>
                  <button
                    onClick={clearRecording}
                    disabled={isUploading}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
