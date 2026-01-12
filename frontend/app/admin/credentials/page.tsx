/**
 * Admin Credential Management Dashboard
 * Allows admins to manage credentials, review, revoke, and audit
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  visibility: string
  created_at: string
  verification_count: number
  credential_issuers?: {
    id: string
    name: string
    logo_url?: string
  }
  blockchain_anchors?: Array<{
    transaction_hash: string
    block_number: number
    chain_name: string
    network: string
    status: string
  }>
}

export default function AdminCredentialsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTrustLevel, setFilterTrustLevel] = useState<string>('all')
  const [selectedCredentials, setSelectedCredentials] = useState<Set<string>>(new Set())
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    loadCredentials()
  }, [filterStatus, filterTrustLevel])

  async function loadCredentials() {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterTrustLevel !== 'all') params.append('trust_level', filterTrustLevel)
      params.append('admin', 'true')

      const response = await fetch(`/api/credentials/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load credentials')
        setLoading(false)
        return
      }

      setCredentials(data.credentials || [])
    } catch (err: any) {
      console.error('[Admin Credentials] Error:', err)
      setError(err.message || 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  async function revokeCredential(credentialId: string, reason?: string) {
    try {
      setRevokingId(credentialId)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch('/api/credentials/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          credentialId,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to revoke credential')
        return
      }

      // Reload credentials
      await loadCredentials()
    } catch (err: any) {
      console.error('[Admin Credentials] Revoke error:', err)
      setError(err.message || 'Failed to revoke credential')
    } finally {
      setRevokingId(null)
    }
  }

  function toggleSelect(credentialId: string) {
    setSelectedCredentials(prev => {
      const newSet = new Set(prev)
      if (newSet.has(credentialId)) {
        newSet.delete(credentialId)
      } else {
        newSet.add(credentialId)
      }
      return newSet
    })
  }

  function selectAll() {
    setSelectedCredentials(new Set(credentials.map(c => c.id)))
  }

  function deselectAll() {
    setSelectedCredentials(new Set())
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'active':
        return <span className={`${baseClasses} bg-green-500/20 text-green-400`}>Active</span>
      case 'expired':
        return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400`}>Expired</span>
      case 'revoked':
        return <span className={`${baseClasses} bg-red-500/20 text-red-400`}>Revoked</span>
      case 'suspended':
        return <span className={`${baseClasses} bg-orange-500/20 text-orange-400`}>Suspended</span>
      default:
        return <span className={`${baseClasses} bg-slate-500/20 text-slate-400`}>{status}</span>
    }
  }

  const getTrustLevelBadge = (level: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    switch (level) {
      case 'issuer_signed':
        return <span className={`${baseClasses} bg-blue-500/20 text-blue-400`}>Issuer Signed</span>
      case 'reviewed':
        return <span className={`${baseClasses} bg-purple-500/20 text-purple-400`}>Reviewed</span>
      case 'ai_checked':
        return <span className={`${baseClasses} bg-indigo-500/20 text-indigo-400`}>AI Checked</span>
      case 'self_asserted':
        return <span className={`${baseClasses} bg-slate-500/20 text-slate-400`}>Self Asserted</span>
      default:
        return <span className={`${baseClasses} bg-slate-500/20 text-slate-400`}>{level}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading credentials...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-block mb-4 text-blue-400 hover:text-blue-300">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Credential Management</h1>
          <p className="text-slate-400">Manage, review, and audit all credentials</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Trust Level</label>
              <select
                value={filterTrustLevel}
                onChange={(e) => setFilterTrustLevel(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
              >
                <option value="all">All Trust Levels</option>
                <option value="self_asserted">Self Asserted</option>
                <option value="ai_checked">AI Checked</option>
                <option value="reviewed">Reviewed</option>
                <option value="issuer_signed">Issuer Signed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Credentials Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {credentials.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">No credentials found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedCredentials.size === credentials.length && credentials.length > 0}
                    onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-400">
                    {selectedCredentials.size} selected
                  </span>
                </div>
                {selectedCredentials.size > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(`Revoke ${selectedCredentials.size} selected credentials?`)) {
                        selectedCredentials.forEach(id => revokeCredential(id))
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Revoke Selected
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Issuer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Trust Level</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Issued</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Verifications</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Blockchain</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {credentials.map((credential) => (
                      <tr key={credential.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedCredentials.has(credential.id)}
                            onChange={() => toggleSelect(credential.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-white">{credential.title}</div>
                            {credential.description && (
                              <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {credential.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-300">
                            {credential.credential_issuers?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-300">
                            {credential.credential_type || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(credential.status)}
                        </td>
                        <td className="px-4 py-3">
                          {getTrustLevelBadge(credential.trust_level)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-300">
                            {new Date(credential.issued_date).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-300">
                            {credential.verification_count || 0}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {credential.blockchain_anchors && credential.blockchain_anchors.length > 0 ? (
                            <span className="text-xs text-green-400">✓ Anchored</span>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/verify/${credential.id}`}
                              target="_blank"
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              View
                            </Link>
                            {credential.status !== 'revoked' && (
                              <button
                                onClick={() => {
                                  const reason = prompt('Reason for revocation (optional):')
                                  if (reason !== null) {
                                    revokeCredential(credential.id, reason)
                                  }
                                }}
                                disabled={revokingId === credential.id}
                                className="text-xs text-red-400 hover:text-red-300 underline disabled:opacity-50"
                              >
                                {revokingId === credential.id ? 'Revoking...' : 'Revoke'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Total Credentials</div>
            <div className="text-2xl font-bold text-white">{credentials.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-400">
              {credentials.filter(c => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Revoked</div>
            <div className="text-2xl font-bold text-red-400">
              {credentials.filter(c => c.status === 'revoked').length}
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-sm text-slate-400 mb-1">Total Verifications</div>
            <div className="text-2xl font-bold text-blue-400">
              {credentials.reduce((sum, c) => sum + (c.verification_count || 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
