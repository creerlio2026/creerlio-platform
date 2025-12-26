'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'talent' | 'business' | 'users'>('overview')

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/admin')
          return
        }

        setUser(u)

        // Check if user is admin (check metadata or email)
        const { data: { user: freshUser } } = await supabase.auth.getUser()
        const userMetadata = (freshUser || u).user_metadata || {}
        const email = u.email || ''
        
        // Check admin flags
        const hasAdminFlag = userMetadata.is_admin === true || userMetadata.admin === true
        
        // Check admin emails from env (client-side check - backend will verify)
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
        const isAdminEmail = adminEmails.includes(email.toLowerCase())
        
        if (hasAdminFlag || isAdminEmail) {
          setIsAdmin(true)
          loadStats(u.id)
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

  async function loadStats(userId: string) {
    try {
      // Get counts from Supabase directly
      const [talentRes, businessRes, recentTalentRes, recentBusinessRes] = await Promise.all([
        supabase.from('talent_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('business_profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('talent_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('business_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ])
      
      setStats({
        total_talent: talentRes.count || 0,
        total_business: businessRes.count || 0,
        total_users: (talentRes.count || 0) + (businessRes.count || 0),
        recent_talent_7d: recentTalentRes.count || 0,
        recent_business_7d: recentBusinessRes.count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
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
              <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
                Creerlio
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-lg font-semibold">Administration Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">{user?.email}</span>
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
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-8 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {(['overview', 'talent', 'business', 'users'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
            
            {stats ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">Total Talent</h3>
                  <p className="text-3xl font-bold text-white">{stats.total_talent || 0}</p>
                </div>
                <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">Total Business</h3>
                  <p className="text-3xl font-bold text-white">{stats.total_business || 0}</p>
                </div>
                <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">Total Users</h3>
                  <p className="text-3xl font-bold text-white">{stats.total_users || 0}</p>
                </div>
                <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
                  <h3 className="text-gray-400 text-sm mb-2">New Registrations (7d)</h3>
                  <p className="text-3xl font-bold text-white">
                    {(stats.recent_talent_7d || 0) + (stats.recent_business_7d || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Talent: {stats.recent_talent_7d || 0} | Business: {stats.recent_business_7d || 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/talent"
                  className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <h3 className="font-semibold text-blue-400 mb-2">Manage Talent</h3>
                  <p className="text-sm text-gray-400">View and manage talent registrations</p>
                </Link>
                <Link
                  href="/admin/business"
                  className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <h3 className="font-semibold text-green-400 mb-2">Manage Business</h3>
                  <p className="text-sm text-gray-400">View and manage business registrations</p>
                </Link>
                <Link
                  href="/admin/users"
                  className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <h3 className="font-semibold text-purple-400 mb-2">Manage Users</h3>
                  <p className="text-sm text-gray-400">View and manage all users</p>
                </Link>
                <Link
                  href="/admin/portfolios"
                  className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors"
                >
                  <h3 className="font-semibold text-yellow-400 mb-2">All Portfolios</h3>
                  <p className="text-sm text-gray-400">View all talent portfolios and business profiles</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'talent' && (
          <div>
            <Link href="/admin/talent" className="text-blue-400 hover:text-blue-300">
              → Go to Talent Management
            </Link>
          </div>
        )}

        {activeTab === 'business' && (
          <div>
            <Link href="/admin/business" className="text-green-400 hover:text-green-300">
              → Go to Business Management
            </Link>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <Link href="/admin/users" className="text-purple-400 hover:text-purple-300">
              → Go to User Management
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

