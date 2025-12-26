'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminUsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [usersList, setUsersList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/admin/users')
          return
        }

        setUser(u)
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const userMetadata = (freshUser || u).user_metadata || {}
        const email = u.email || ''
        
        const hasAdminFlag = userMetadata.is_admin === true || userMetadata.admin === true
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
        const isAdminEmail = adminEmails.includes(email.toLowerCase())
        
        if (hasAdminFlag || isAdminEmail) {
          setIsAdmin(true)
          loadUsers(u.id)
        } else {
          alert('Access denied. Admin privileges required.')
          router.replace('/')
        }
      } catch (error) {
        console.error('Error checking admin:', error)
        router.replace('/')
      } finally {
        setIsLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  async function loadUsers(userId: string) {
    try {
      // Get users from both talent and business profiles
      // Use select('*') to get all available columns, then extract what we need
      const [talentRes, businessRes] = await Promise.all([
        supabase.from('talent_profiles').select('*'),
        supabase.from('business_profiles').select('*')
      ])
      
      if (talentRes.error) {
        console.error('Error loading talent profiles:', talentRes.error)
        if (talentRes.error.code === '42501' || talentRes.error.message?.includes('policy') || talentRes.error.message?.includes('RLS')) {
          throw new Error('Permission denied. Admin RLS policies may not be set up. Please run admin_rls_policies.sql in Supabase SQL Editor.')
        }
        throw talentRes.error
      }
      if (businessRes.error) {
        console.error('Error loading business profiles:', businessRes.error)
        if (businessRes.error.code === '42501' || businessRes.error.message?.includes('policy') || businessRes.error.message?.includes('RLS')) {
          throw new Error('Permission denied. Admin RLS policies may not be set up. Please run admin_rls_policies.sql in Supabase SQL Editor.')
        }
        throw businessRes.error
      }
      
      const users: any[] = []
      const seenUserIds = new Set<string>()
      
      // Add talent users - handle various possible column names
      for (const tp of (talentRes.data || [])) {
        const userId = tp.user_id || tp.id
        if (userId && !seenUserIds.has(userId)) {
          // Try different possible name fields
          const name = tp.name || tp.talent_name || tp.full_name || tp.display_name || 'N/A'
          const email = tp.email || 'N/A'
          
          users.push({
            user_id: userId,
            name: name,
            email: email,
            type: 'talent',
            created_at: tp.created_at,
            is_active: tp.is_active ?? true
          })
          seenUserIds.add(userId)
        }
      }
      
      // Add business users - handle various possible column names
      for (const bp of (businessRes.data || [])) {
        const userId = bp.user_id || bp.id
        if (userId && !seenUserIds.has(userId)) {
          // Try different possible name fields
          const name = bp.name || bp.business_name || bp.company_name || 'N/A'
          const email = bp.email || 'N/A'
          
          users.push({
            user_id: userId,
            name: name,
            email: email,
            type: 'business',
            created_at: bp.created_at,
            is_active: bp.is_active ?? true
          })
          seenUserIds.add(userId)
        }
      }
      
      // Sort by created_at descending
      users.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
      
      // Apply search filter if provided
      let filtered = users
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        filtered = users.filter((u: any) =>
          (u.name || '').toLowerCase().includes(searchLower) ||
          (u.email || '').toLowerCase().includes(searchLower)
        )
      }
      
      // Apply pagination
      const total = filtered.length
      const paginated = filtered.slice(page * 50, (page + 1) * 50)
      
      setUsersList(paginated)
      setTotalCount(total)
    } catch (error: any) {
      console.error('Error loading users:', error)
      const errorMsg = error?.message || 'Failed to load users'
      alert(errorMsg)
    }
  }

  useEffect(() => {
    if (isAdmin && user) {
      loadUsers(user.id)
    }
  }, [page, searchQuery, isAdmin, user])

  async function deleteUser(userId: string) {
    if (!user) return
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone. This will delete the auth user and all associated profiles.')) {
      return
    }
    
    try {
      // Delete talent profile if exists
      const { error: talentError } = await supabase
        .from('talent_profiles')
        .delete()
        .eq('user_id', userId)
      
      if (talentError) console.warn('Error deleting talent profile:', talentError)
      
      // Delete business profile if exists
      const { error: businessError } = await supabase
        .from('business_profiles')
        .delete()
        .eq('user_id', userId)
      
      if (businessError) console.warn('Error deleting business profile:', businessError)
      
      // Note: Deleting the auth user requires admin API access
      // For now, we'll delete the profiles. The auth user deletion would need
      // to be done via Supabase Admin API or a backend service
      alert('User profiles deleted. Note: Auth user deletion requires admin API access.')
      
      // Reload list
      loadUsers(user.id)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user: ${error?.message || 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
                ← Admin Panel
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-lg font-semibold">User Management</span>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">All Users</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((usr) => (
                  <tr 
                    key={usr.user_id} 
                    className="border-b border-white/5 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => router.push(`/admin/users/${usr.user_id}`)}
                  >
                    <td className="px-6 py-4 text-gray-400 text-sm font-mono">{usr.user_id?.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-white">{usr.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-300">{usr.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          usr.type === 'talent'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-green-500/20 text-green-400 border border-green-500/50'
                        }`}
                      >
                        {usr.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          usr.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}
                      >
                        {usr.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {usr.created_at
                        ? new Date(usr.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/users/${usr.user_id}`)
                          }}
                          className="px-3 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteUser(usr.user_id)
                          }}
                          className="px-3 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usersList.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No users found</p>
            </div>
          )}

          {/* Pagination */}
          {totalCount > 50 && (
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {page * 50 + 1} - {Math.min((page + 1) * 50, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 50 >= totalCount}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

