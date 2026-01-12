/**
 * Credential Upload Page
 * Allows users to upload credentials and generate QR codes
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateQRCodeDataUrl, getVerificationUrl } from '@/lib/qr'
import Image from 'next/image'

interface CredentialIssuer {
  id: string
  name: string
  logo_url?: string
}

export default function CredentialUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [credentialType, setCredentialType] = useState('')
  const [category, setCategory] = useState('')
  const [credentialIssuerId, setCredentialIssuerId] = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [trustLevel, setTrustLevel] = useState('self_asserted')
  const [visibility, setVisibility] = useState('link_only')
  
  // Issuers list
  const [issuers, setIssuers] = useState<CredentialIssuer[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [createdCredential, setCreatedCredential] = useState<any>(null)

  // Load issuers on mount
  useEffect(() => {
    loadIssuers()
  }, [])

  async function loadIssuers() {
    try {
      const { data, error } = await supabase
        .from('credential_issuers')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('[Credential Upload] Issuers load error:', error)
        return
      }

      setIssuers(data || [])
    } catch (err) {
      console.error('[Credential Upload] Issuers load exception:', err)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)

    // Create preview URL for images
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to upload credentials')
        router.push('/login')
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      if (description) formData.append('description', description)
      if (credentialType) formData.append('credential_type', credentialType)
      if (category) formData.append('category', category)
      if (credentialIssuerId) formData.append('credential_issuer_id', credentialIssuerId)
      if (issuedDate) formData.append('issued_date', issuedDate)
      if (expiryDate) formData.append('expiry_date', expiryDate)
      formData.append('trust_level', trustLevel)
      formData.append('visibility', visibility)

      // Upload credential
      const response = await fetch('/api/credentials/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload credential')
        return
      }

      setCreatedCredential(data.credential)
      setSuccess(true)

      // Generate QR code
      const verificationUrl = getVerificationUrl(data.credential.qr_token)
      const qrDataUrl = await generateQRCodeDataUrl(verificationUrl)
      setQrCodeUrl(qrDataUrl)

      // Reset form
      setFile(null)
      setPreviewUrl(null)
      setTitle('')
      setDescription('')
      setCredentialType('')
      setCategory('')
      setCredentialIssuerId('')
      setIssuedDate('')
      setExpiryDate('')
      setTrustLevel('self_asserted')
      setVisibility('link_only')
    } catch (err: any) {
      console.error('[Credential Upload] Error:', err)
      setError(err.message || 'Failed to upload credential')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-block mb-4 text-blue-400 hover:text-blue-300"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Upload Credential</h1>
          <p className="text-slate-400">Upload and verify your credentials with blockchain anchoring</p>
        </div>

        {/* Success Message */}
        {success && createdCredential && (
          <div className="mb-6 p-6 bg-green-500/20 border border-green-500/50 rounded-xl">
            <h2 className="text-xl font-semibold text-green-400 mb-4">✓ Credential Uploaded Successfully!</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Verification URL:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getVerificationUrl(createdCredential.qr_token)}
                    className="flex-1 p-2 rounded bg-slate-900 border border-slate-700 text-white text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getVerificationUrl(createdCredential.qr_token))
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              {qrCodeUrl && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">QR Code:</p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={256}
                      height={256}
                      className="w-64 h-64"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/verify/${createdCredential.qr_token}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  View Credential
                </button>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setCreatedCredential(null)
                    setQrCodeUrl(null)
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Upload Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Credential File *
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    id="file-input"
                    required
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={200}
                          height={200}
                          className="mx-auto rounded-lg max-h-48 object-contain"
                        />
                        <p className="text-sm text-slate-400">{file?.name}</p>
                      </div>
                    ) : file ? (
                      <div>
                        <p className="text-white font-medium mb-2">{file.name}</p>
                        <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-400 mb-2">Click to select a file</p>
                        <p className="text-xs text-slate-500">PDF, JPG, PNG, DOC, DOCX</p>
                      </div>
                    )}
                  </label>
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setPreviewUrl(null)
                    }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Remove file
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Commercial Driver Licence"
                  required
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details about this credential"
                  rows={3}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Credential Type & Category */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Credential Type (optional)
                  </label>
                  <input
                    type="text"
                    value={credentialType}
                    onChange={(e) => setCredentialType(e.target.value)}
                    placeholder="e.g., Licence, Certification, Degree"
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Construction, Healthcare, Transport"
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Issuer */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Issuer (optional)
                </label>
                <select
                  value={credentialIssuerId}
                  onChange={(e) => setCredentialIssuerId(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select an issuer</option>
                  {issuers.map((issuer) => (
                    <option key={issuer.id} value={issuer.id}>
                      {issuer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issued Date & Expiry Date */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Issued Date (optional)
                  </label>
                  <input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Trust Level & Visibility */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Trust Level
                  </label>
                  <select
                    value={trustLevel}
                    onChange={(e) => setTrustLevel(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="self_asserted">Self Asserted</option>
                    <option value="ai_checked">AI Checked</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="issuer_signed">Issuer Signed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="link_only">Link Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Upload Credential'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
