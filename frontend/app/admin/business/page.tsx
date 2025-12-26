'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminBusinessPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [businessList, setBusinessList] = useState<any[]>([])
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
          router.replace('/login?redirect=/admin/business')
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
          loadBusiness(u.id)
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

  async function loadBusiness(userId: string) {
    try {
      // Use Supabase directly
      let query = supabase
        .from('business_profiles')
        .select('*')
      
      // Apply search filter if provided
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const { data: allData, error } = await supabase
          .from('business_profiles')
          .select('*')
        
        if (error) throw error
        
        // Filter in JavaScript - handle various possible column names
        const filtered = (allData || []).filter((item: any) => {
          const name = item.name || item.business_name || item.company_name || ''
          const email = item.email || ''
          return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower)
        })
        
        // Sort by created_at descending
        filtered.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
        
        // Apply pagination
        const total = filtered.length
        const paginated = filtered.slice(page * 50, (page + 1) * 50)
        
        setBusinessList(paginated)
        setTotalCount(total)
        return
      }
      
      // No search - get all results first (RLS might limit, so we get all and paginate in JS)
      const { data: allData, error, count } = await supabase
        .from('business_profiles')
        .select('*', { count: 'exact' })
      
      if (error) {
        console.error('Supabase error:', error)
        // Check if it's an RLS error
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
          throw new Error('Permission denied. Admin RLS policies may not be set up. Please run admin_rls_policies.sql in Supabase SQL Editor.')
        }
        throw error
      }
      
      // Sort and paginate in JavaScript
      const sorted = (allData || []).sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
      
      const paginated = sorted.slice(page * 50, (page + 1) * 50)
      
      setBusinessList(paginated)
      setTotalCount(count || sorted.length)
    } catch (error: any) {
      console.error('Error loading business:', error)
      const errorMsg = error?.message || 'Failed to load business registrations'
      alert(errorMsg)
    }
  }

  useEffect(() => {
    if (isAdmin && user) {
      loadBusiness(user.id)
    }
  }, [page, searchQuery, isAdmin, user])

  async function toggleActive(businessId: string, currentStatus: boolean) {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', businessId)

      if (error) throw error

      // Reload list
      loadBusiness(user.id)
    } catch (error: any) {
      console.error('Error updating business:', error)
      alert(`Failed to update business status: ${error?.message || 'Unknown error'}`)
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
              <span className="text-lg font-semibold">Business Management</span>
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
          <h1 className="text-3xl font-bold">Business Registrations</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Industry</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businessList.map((business) => {
                  // Handle various possible column names
                  const name = business.name || business.business_name || business.company_name || 'N/A'
                  const email = business.email || 'N/A'
                  const industry = business.industry || business.sector || 'N/A'
                  const location = business.location || business.city || business.address || 'N/A'
                  
                  return (
                  <tr 
                    key={business.id} 
                    className="border-b border-white/5 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => router.push(`/admin/users/${business.user_id || business.id}`)}
                  >
                    <td className="px-6 py-4 text-white">{name}</td>
                    <td className="px-6 py-4 text-gray-300">{email}</td>
                    <td className="px-6 py-4 text-gray-300">{industry}</td>
                    <td className="px-6 py-4 text-gray-300">{location}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          business.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                        }`}
                      >
                        {business.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {business.created_at
                        ? new Date(business.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/users/${business.user_id || business.id}`)
                          }}
                          className="px-3 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleActive(business.id, business.is_active)
                          }}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            business.is_active
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                          }`}
                        >
                          {business.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {businessList.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No business registrations found</p>
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

