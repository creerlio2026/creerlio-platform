'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminPortfoliosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'talent' | 'business'>('talent')
  const [talentPortfolios, setTalentPortfolios] = useState<any[]>([])
  const [businessProfiles, setBusinessProfiles] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [talentLoading, setTalentLoading] = useState(false)
  const [businessLoading, setBusinessLoading] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const u = sessionRes.session?.user
        if (!u?.id) {
          router.replace('/login?redirect=/admin/portfolios')
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
          loadTalentPortfolios()
          loadBusinessProfiles()
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

  async function loadTalentPortfolios() {
    setTalentLoading(true)
    try {
      // Get all talent profiles
      const { data: talentProfiles, error: talentError } = await supabase
        .from('talent_profiles')
        .select('id, user_id, name, email, title, created_at, is_active')
        .order('created_at', { ascending: false })

      if (talentError) {
        console.error('Error loading talent profiles:', talentError)
        // Check if it's an RLS error
        if (talentError.code === '42501' || talentError.message?.includes('policy') || talentError.message?.includes('RLS')) {
          alert('Permission denied. Admin RLS policies may not be set up. Please run admin_rls_policies.sql in Supabase SQL Editor.')
        }
        return
      }

      // Get all portfolio items
      const { data: portfolioItems, error: portfolioError } = await supabase
        .from('talent_bank_items')
        .select('user_id, metadata, created_at')
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })

      if (portfolioError) {
        console.error('Error loading portfolio items:', portfolioError)
      }

      // Combine talent profiles with their portfolio data
      const portfolios = (talentProfiles || []).map((profile: any) => {
        const portfolio = (portfolioItems || []).find((item: any) => item.user_id === profile.user_id)
        return {
          ...profile,
          hasPortfolio: !!portfolio,
          portfolioMeta: portfolio?.metadata || null,
          portfolioCreatedAt: portfolio?.created_at || null,
          profileName: profile.name || profile.talent_name || profile.full_name || 'N/A',
          profileEmail: profile.email || 'N/A',
        }
      })

      setTalentPortfolios(portfolios)
    } catch (error: any) {
      console.error('Error loading talent portfolios:', error)
    } finally {
      setTalentLoading(false)
    }
  }

  async function loadBusinessProfiles() {
    setBusinessLoading(true)
    try {
      // Get all business profiles
      const { data: businessProfilesData, error: businessError } = await supabase
        .from('business_profiles')
        .select('id, user_id, name, email, industry, created_at, is_active')
        .order('created_at', { ascending: false })

      if (businessError) {
        console.error('Error loading business profiles:', businessError)
        // Check if it's an RLS error
        if (businessError.code === '42501' || businessError.message?.includes('policy') || businessError.message?.includes('RLS')) {
          alert('Permission denied. Admin RLS policies may not be set up. Please run admin_rls_policies.sql in Supabase SQL Editor.')
        }
        return
      }

      // Get business profile pages
      const { data: businessPages, error: pagesError } = await supabase
        .from('business_profile_pages')
        .select('business_id, slug, is_published, tagline, mission')
        .order('created_at', { ascending: false })

      // Combine business profiles with their page data
      const profiles = (businessProfilesData || []).map((profile: any) => {
        const page = (businessPages || []).find((p: any) => p.business_id === profile.id)
        return {
          ...profile,
          hasProfilePage: !!page,
          profilePage: page || null,
          profileName: profile.name || profile.business_name || profile.company_name || 'N/A',
          profileEmail: profile.email || 'N/A',
        }
      })

      setBusinessProfiles(profiles)
    } catch (error: any) {
      console.error('Error loading business profiles:', error)
    } finally {
      setBusinessLoading(false)
    }
  }

  // Filter portfolios based on search
  const filteredTalentPortfolios = talentPortfolios.filter((portfolio) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      (portfolio.profileName || '').toLowerCase().includes(searchLower) ||
      (portfolio.profileEmail || '').toLowerCase().includes(searchLower) ||
      (portfolio.title || '').toLowerCase().includes(searchLower)
    )
  })

  const filteredBusinessProfiles = businessProfiles.filter((profile) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      (profile.profileName || '').toLowerCase().includes(searchLower) ||
      (profile.profileEmail || '').toLowerCase().includes(searchLower) ||
      (profile.industry || '').toLowerCase().includes(searchLower)
    )
  })

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
              <span className="text-lg font-semibold">All Portfolios</span>
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
          <h1 className="text-3xl font-bold">All Portfolios & Profiles</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {(['talent', 'business'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'talent' ? 'Talent Portfolios' : 'Business Profiles'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Talent Portfolios Tab */}
        {activeTab === 'talent' && (
          <div className="space-y-4">
            {talentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-400">
                    Showing {filteredTalentPortfolios.length} of {talentPortfolios.length} talent registrations
                    {filteredTalentPortfolios.filter(p => p.hasPortfolio).length > 0 && (
                      <span className="text-blue-400 ml-2">
                        ({filteredTalentPortfolios.filter(p => p.hasPortfolio).length} with portfolios)
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTalentPortfolios.map((portfolio) => (
                    <div
                      key={portfolio.id}
                      className="bg-slate-900/70 border border-white/10 rounded-xl p-6 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {portfolio.profileName}
                          </h3>
                          <p className="text-sm text-gray-400">{portfolio.profileEmail}</p>
                          {portfolio.title && (
                            <p className="text-sm text-gray-300 mt-1">{portfolio.title}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            portfolio.is_active
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}
                        >
                          {portfolio.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Portfolio Status:</span>
                          <span
                            className={`font-semibold ${
                              portfolio.hasPortfolio
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }`}
                          >
                            {portfolio.hasPortfolio ? '✓ Created' : 'Not Created'}
                          </span>
                        </div>
                        {portfolio.portfolioCreatedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Portfolio Created:</span>
                            <span className="text-gray-300">
                              {new Date(portfolio.portfolioCreatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Profile Created:</span>
                          <span className="text-gray-300">
                            {new Date(portfolio.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                        <Link
                          href={`/admin/users/${portfolio.user_id}`}
                          className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-center text-sm font-semibold transition-colors"
                        >
                          View Details
                        </Link>
                        {portfolio.hasPortfolio && (
                          <Link
                            href={`/admin/users/${portfolio.user_id}/portfolio`}
                            className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-center text-sm font-semibold transition-colors"
                          >
                            View Portfolio
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTalentPortfolios.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No talent portfolios found</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Business Profiles Tab */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            {businessLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-400">
                    Showing {filteredBusinessProfiles.length} of {businessProfiles.length} business registrations
                    {filteredBusinessProfiles.filter(p => p.hasProfilePage).length > 0 && (
                      <span className="text-green-400 ml-2">
                        ({filteredBusinessProfiles.filter(p => p.hasProfilePage).length} with profile pages)
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBusinessProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="bg-slate-900/70 border border-white/10 rounded-xl p-6 hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {profile.profileName}
                          </h3>
                          <p className="text-sm text-gray-400">{profile.profileEmail}</p>
                          {profile.industry && (
                            <p className="text-sm text-gray-300 mt-1">{profile.industry}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            profile.is_active
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}
                        >
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Profile Page:</span>
                          <span
                            className={`font-semibold ${
                              profile.hasProfilePage
                                ? 'text-green-400'
                                : 'text-gray-500'
                            }`}
                          >
                            {profile.hasProfilePage ? '✓ Published' : 'Not Published'}
                          </span>
                        </div>
                        {profile.profilePage?.slug && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Slug:</span>
                            <span className="text-gray-300 font-mono text-xs">
                              {profile.profilePage.slug}
                            </span>
                          </div>
                        )}
                        {profile.profilePage?.tagline && (
                          <div className="text-sm">
                            <span className="text-gray-400">Tagline: </span>
                            <span className="text-gray-300 italic">
                              "{profile.profilePage.tagline}"
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Profile Created:</span>
                          <span className="text-gray-300">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                        <Link
                          href={`/admin/users/${profile.user_id}`}
                          className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-center text-sm font-semibold transition-colors"
                        >
                          View Details
                        </Link>
                        {profile.hasProfilePage && (
                          <Link
                            href={`/admin/users/${profile.user_id}/business`}
                            className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 text-center text-sm font-semibold transition-colors"
                          >
                            View Profile
                          </Link>
                        )}
                        {profile.profilePage?.slug && (
                          <Link
                            href={`/business/${profile.profilePage.slug}`}
                            target="_blank"
                            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 text-center text-sm font-semibold transition-colors"
                            title="View public profile"
                          >
                            ↗
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredBusinessProfiles.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No business profiles found</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

