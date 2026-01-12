/**
 * Public Credential Verification Page
 * Route: /verify/{token}
 * Displays credential details and verification status
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Credential {
  id: string
  title: string
  description?: string
  credential_type?: string
  category?: string
  issued_date: string
  expiry_date?: string
  status: string
  trust_level: string
  issuer?: {
    name: string
    logo_url?: string
    website_url?: string
  }
}

interface Verification {
  result: 'valid' | 'expired' | 'revoked' | 'mismatch' | 'not_found'
  hash_match: boolean
  blockchain_verified: boolean
  blockchain_tx_url?: string
}

export default function VerifyCredentialPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [credential, setCredential] = useState<Credential | null>(null)
  const [verification, setVerification] = useState<Verification | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid verification token')
      setLoading(false)
      return
    }

    loadVerification()
  }, [token])

  async function loadVerification() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/credentials/verify?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to verify credential' }))
        setError(errorData.error || 'Failed to verify credential')
        setLoading(false)
        return
      }

      const data = await response.json()
      setCredential(data.credential)
      setVerification(data.verification)
    } catch (err: any) {
      console.error('[Verify] Error:', err)
      setError(err.message || 'Failed to verify credential')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!verification) return null

    const status = verification.result
    const baseClasses = 'px-4 py-2 rounded-full text-sm font-semibold'

    switch (status) {
      case 'valid':
        return (
          <span className={`${baseClasses} bg-green-500/20 text-green-400 border border-green-500/50`}>
            ✓ VALID
          </span>
        )
      case 'expired':
        return (
          <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/50`}>
            ⚠ EXPIRED
          </span>
        )
      case 'revoked':
        return (
          <span className={`${baseClasses} bg-red-500/20 text-red-400 border border-red-500/50`}>
            ✗ REVOKED
          </span>
        )
      case 'mismatch':
        return (
          <span className={`${baseClasses} bg-red-500/20 text-red-400 border border-red-500/50`}>
            ✗ HASH MISMATCH
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-slate-500/20 text-slate-400 border border-slate-500/50`}>
            ? UNKNOWN
          </span>
        )
    }
  }

  const getTrustLevelBadge = () => {
    if (!credential) return null

    const level = credential.trust_level
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium'

    switch (level) {
      case 'issuer_signed':
        return (
          <span className={`${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/50`}>
            🏛 Issuer Signed
          </span>
        )
      case 'reviewed':
        return (
          <span className={`${baseClasses} bg-purple-500/20 text-purple-400 border border-purple-500/50`}>
            ✓ Reviewed
          </span>
        )
      case 'ai_checked':
        return (
          <span className={`${baseClasses} bg-indigo-500/20 text-indigo-400 border border-indigo-500/50`}>
            🤖 AI Checked
          </span>
        )
      case 'self_asserted':
        return (
          <span className={`${baseClasses} bg-slate-500/20 text-slate-400 border border-slate-500/50`}>
            📝 Self Asserted
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Verifying credential...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/50 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✗</div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!credential || !verification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Credential Not Found</h1>
          <p className="text-slate-400 mb-6">The credential you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Creerlio
            </h1>
          </Link>
          <p className="text-slate-400">Credential Verification</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <div>{getStatusBadge()}</div>
            {getTrustLevelBadge()}
          </div>

          {/* Issuer Info */}
          {credential.issuer && (
            <div className="mb-6 pb-6 border-b border-slate-700">
              <div className="flex items-center gap-4">
                {credential.issuer.logo_url && (
                  <Image
                    src={credential.issuer.logo_url}
                    alt={credential.issuer.name}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <p className="text-sm text-slate-400 mb-1">Issued by</p>
                  <h2 className="text-xl font-semibold text-white">
                    {credential.issuer.website_url ? (
                      <a
                        href={credential.issuer.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-400 transition-colors"
                      >
                        {credential.issuer.name}
                      </a>
                    ) : (
                      credential.issuer.name
                    )}
                  </h2>
                </div>
              </div>
            </div>
          )}

          {/* Credential Details */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-4">{credential.title}</h1>
            
            {credential.description && (
              <p className="text-slate-300 mb-6">{credential.description}</p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {credential.credential_type && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Type</p>
                  <p className="text-white font-medium">{credential.credential_type}</p>
                </div>
              )}
              
              {credential.category && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Category</p>
                  <p className="text-white font-medium">{credential.category}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-400 mb-1">Issued Date</p>
                <p className="text-white font-medium">
                  {new Date(credential.issued_date).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {credential.expiry_date && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Expiry Date</p>
                  <p className={`font-medium ${
                    new Date(credential.expiry_date) < new Date()
                      ? 'text-red-400'
                      : 'text-white'
                  }`}>
                    {new Date(credential.expiry_date).toLocaleDateString('en-AU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Verification Details */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Verification Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">File Hash Match</span>
                <span className={`font-semibold ${
                  verification.hash_match ? 'text-green-400' : 'text-red-400'
                }`}>
                  {verification.hash_match ? '✓ Verified' : '✗ Mismatch'}
                </span>
              </div>

              {verification.blockchain_tx_url && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Blockchain Verification</span>
                  <span className={`font-semibold ${
                    verification.blockchain_verified ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {verification.blockchain_verified ? '✓ Verified on-chain' : '⚠ Pending'}
                  </span>
                </div>
              )}

              {verification.blockchain_tx_url && (
                <div className="pt-3 border-t border-slate-700">
                  <a
                    href={verification.blockchain_tx_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
                  >
                    View Blockchain Transaction
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-2">
              Verified via Creerlio Credential Verification System
            </p>
            <p className="text-xs text-slate-500">
              Token: {token.substring(0, 8)}...{token.substring(token.length - 8)}
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
