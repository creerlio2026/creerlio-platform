'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import VideoChat from '@/components/VideoChat'

type PortfolioMeta = Record<string, any>

type SocialPlatform =
  | 'LinkedIn'
  | 'GitHub'
  | 'YouTube'
  | 'X'
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'Behance'
  | 'Dribbble'
  | 'Website'

type SocialLink = { platform: SocialPlatform | string; url: string }

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

async function signedUrl(path: string, seconds = 60 * 30, usePublicUrl = false) {
  if (!path) return null
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // If usePublicUrl is true, use public URL directly (for business viewers)
  if (usePublicUrl && supabaseUrl) {
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
    return publicUrl
  }
  
  try {
    const { data, error } = await supabase.storage.from('talent-bank').createSignedUrl(path, seconds)
    if (error) {
      console.warn('[View Portfolio] Signed URL failed, trying public URL:', error.message)
      // Try public URL as fallback
      if (supabaseUrl) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
        return publicUrl
      }
      return null
    }
    return data?.signedUrl ?? null
  } catch (err) {
    console.error('[View Portfolio] Error creating signed URL:', err)
    // Fallback to public URL
    if (supabaseUrl) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
      return publicUrl
    }
    return null
  }
}

export default function PortfolioViewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const viewTalentId = searchParams?.get('talent_id') // For businesses viewing talent profiles
  const requestId = searchParams?.get('request_id') // Connection request ID
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<PortfolioMeta | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [viewingTalentId, setViewingTalentId] = useState<string | null>(null) // The talent profile ID being viewed
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null) // Connection request status: 'pending', 'accepted', 'declined'
  const [isBusinessInitiated, setIsBusinessInitiated] = useState<boolean>(false) // Whether the business initiated this request
  const [talentSummary, setTalentSummary] = useState<any>(null) // Talent summary data (for business-initiated requests)
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)
  const [introVideoTitle, setIntroVideoTitle] = useState<string | null>(null)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [tbItemCache, setTbItemCache] = useState<Record<number, any>>({})
  const [preview, setPreview] = useState<
    | { kind: 'image'; url: string; title: string }
    | { kind: 'video'; url: string; title: string }
    | { kind: 'pdf'; url: string; title: string }
    | null
  >(null)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [expExpanded, setExpExpanded] = useState<Record<number, boolean>>({})
  const [eduExpanded, setEduExpanded] = useState<Record<number, boolean>>({})
  const [projExpanded, setProjExpanded] = useState<Record<number, boolean>>({})
  const [skillsExpanded, setSkillsExpanded] = useState(false)
  const [expListExpanded, setExpListExpanded] = useState(false)
  const [eduListExpanded, setEduListExpanded] = useState(false)
  const [refListExpanded, setRefListExpanded] = useState(false)
  const [refExpanded, setRefExpanded] = useState<Record<number, boolean>>({})
  const [projListExpanded, setProjListExpanded] = useState(false)
  const [attachExpanded, setAttachExpanded] = useState(false)
  const [personalDocExpanded, setPersonalDocExpanded] = useState<Record<number, boolean>>({})
  const [personalDocListExpanded, setPersonalDocListExpanded] = useState(false)
  const [licenceExpanded, setLicenceExpanded] = useState<Record<number, boolean>>({})
  const [licenceListExpanded, setLicenceListExpanded] = useState(false)
  const [familyCommunityGalleryOpen, setFamilyCommunityGalleryOpen] = useState(false)
  const [familyCommunityViewImage, setFamilyCommunityViewImage] = useState<number | null>(null) // Image ID being viewed with description
  
  // Video Chat and Messaging state (for business viewing talent profiles)
  const [videoChatSession, setVideoChatSession] = useState<any | null>(null)
  const [videoChatLoading, setVideoChatLoading] = useState(false)
  const [videoChatError, setVideoChatError] = useState<string | null>(null)
  const [connectionRequestId, setConnectionRequestId] = useState<string | null>(null) // Store connection request ID for video chat/messaging
  const [talentName, setTalentName] = useState<string | null>(null) // Store talent name for video chat

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: sessionRes } = await supabase.auth.getSession()
        const uid = sessionRes.session?.user?.id ?? null
        const email = sessionRes.session?.user?.email ?? null
        if (!cancelled) setAuthEmail(email)
        
        // Determine which user's portfolio to load
        let targetUserId: string | null = null
        let targetTalentId: string | null = null
        
        if (viewTalentId) {
          // Business is viewing a talent's profile
          // First, get the user_id from talent_profiles.id
          const talentRes = await supabase
            .from('talent_profiles')
            .select('user_id, id')
            .eq('id', viewTalentId)
            .maybeSingle()
          
          if (talentRes.error || !talentRes.data) {
            setError('Talent profile not found.')
            return
          }
          
          targetUserId = talentRes.data.user_id
          targetTalentId = String(talentRes.data.id)
          if (!cancelled) setViewingTalentId(targetTalentId)
        } else {
          // User viewing their own portfolio
          if (!uid) {
            setError('Please sign in to view your portfolio.')
            return
          }
          targetUserId = uid
        }
        
        // For business viewing talent profile, we still need to be authenticated (as business)
        // but we don't need to be the talent themselves
        if (viewTalentId && !uid) {
          setError('Please sign in to view talent profiles.')
          return
        }
        
        if (!cancelled) setUserId(targetUserId || uid)

        // Try to load portfolio from talent_bank_items
        // Note: user_id in talent_bank_items should match the UUID from talent_profiles.user_id
        let portfolioData = null
        let portfolioError = null
        
        if (targetUserId) {
          console.log('[View Portfolio] Attempting to load portfolio for user_id:', targetUserId, 'talent_id:', viewTalentId)
          
          // Try with UUID string first (Supabase auth format)
          let { data, error } = await supabase
            .from('talent_bank_items')
            .select('id, metadata, created_at')
            .eq('user_id', targetUserId)
            .eq('item_type', 'portfolio')
            .order('created_at', { ascending: false })
            .limit(1)

          // If that fails and targetUserId looks like a UUID, try converting to integer if needed
          // (Some systems store user_id as integer in talent_bank_items)
          if (error && targetUserId.includes('-')) {
            console.log('[View Portfolio] UUID format failed, trying alternative query...')
            // Try querying by talent_id through a join or different approach
            // For now, let's try loading all portfolio items and filtering client-side
            const altRes = await supabase
              .from('talent_bank_items')
              .select('id, metadata, created_at, user_id')
              .eq('item_type', 'portfolio')
              .order('created_at', { ascending: false })
              .limit(10)
            
            if (!altRes.error && altRes.data) {
              // Find the one that matches our target user
              // This is a workaround - ideally RLS should allow this
              const matching = altRes.data.find((item: any) => {
                const itemUserId = String(item.user_id)
                return itemUserId === targetUserId || itemUserId === String(viewTalentId)
              })
              if (matching) {
                data = [matching]
                error = null
                console.log('[View Portfolio] Found portfolio via alternative query')
              }
            }
          }

          if (error) {
            console.error('[View Portfolio] Failed to load portfolio:', error)
            console.error('[View Portfolio] Error code:', error.code)
            console.error('[View Portfolio] Error message:', error.message)
            
            // Check if this is an RLS/permission error
            const isPermissionError = error.code === 'PGRST301' || error.code === '42501' || error.message?.includes('permission') || error.message?.includes('RLS') || error.message?.includes('row-level security')
            
            if (isPermissionError && viewTalentId) {
              console.warn('[View Portfolio] ⚠️ RLS PERMISSION ERROR: Portfolio access is blocked by RLS policy.')
              console.warn('[View Portfolio] ⚠️ The migration 2025122511_allow_business_view_connected_talent_portfolios.sql needs to be run!')
            }
            
            portfolioError = error
            // Don't return yet - connection check below will retry if there's an accepted connection
          } else if (data && data.length > 0 && data[0]) {
            portfolioData = data[0]
            console.log('[View Portfolio] ✅ Successfully loaded portfolio from talent_bank_items')
          } else if (data && data.length === 0) {
            console.warn('[View Portfolio] No portfolio items found in talent_bank_items for user_id:', targetUserId)
            // This could mean portfolio doesn't exist OR RLS is blocking (no error but no data)
            // We'll check for connection status later to determine if it's RLS blocking or missing portfolio
          }
        }

        // If no portfolio found in talent_bank_items, check if portfolio actually exists
        // Note: portfolio_data and portfolio_url columns don't exist in talent_profiles
        // Portfolio data is stored in talent_bank_items with item_type = 'portfolio'
        if (!portfolioData && viewTalentId) {
          console.log('[View Portfolio] Portfolio not in talent_bank_items, verifying portfolio existence...')
          
          // Check if portfolio exists for this user (this query might fail due to RLS, but that's ok)
          const portfolioCheck = await supabase
            .from('talent_bank_items')
            .select('id, item_type')
            .eq('user_id', targetUserId)
            .eq('item_type', 'portfolio')
            .limit(1)
          
          if (portfolioCheck.error) {
            console.error('[View Portfolio] Error checking portfolio existence:', portfolioCheck.error)
            console.error('[View Portfolio] Error code:', portfolioCheck.error.code)
            console.error('[View Portfolio] Error message:', portfolioCheck.error.message)
            
            // If it's a permission error (PGRST301 or 42501), RLS is blocking access
            // This means the RLS policy hasn't been applied yet or isn't working
            if (portfolioCheck.error.code === 'PGRST301' || portfolioCheck.error.code === '42501' || portfolioCheck.error.message?.includes('permission')) {
              console.warn('[View Portfolio] ⚠️ RLS is blocking portfolio access. The migration 2025122511_allow_business_view_connected_talent_portfolios.sql may not have been run yet.')
            }
          } else if (portfolioCheck.data && portfolioCheck.data.length > 0) {
            console.log('[View Portfolio] Portfolio exists in database but RLS is blocking access. RLS policy needs to be applied.')
          } else {
            console.log('[View Portfolio] No portfolio found in talent_bank_items for this user. Portfolio may not exist yet.')
          }
        }

        // If still no portfolio and there was an error, log it but don't block if viewing from business context
        // The RLS policy should allow access for accepted connections, so if it's still failing, 
        // we need to investigate the policy or try alternative approaches
        if (portfolioError && !portfolioData) {
          console.error('[View Portfolio] Portfolio loading error:', portfolioError)
          console.error('[View Portfolio] Error details:', {
            code: portfolioError.code,
            message: portfolioError.message,
            details: portfolioError.details,
            hint: portfolioError.hint,
            viewTalentId,
            targetUserId
          })
          
          // Don't set error if we're viewing from business context - show empty state instead
          // But we should still try to load the portfolio if there's an accepted connection
          if (!viewTalentId) {
            setError(portfolioError.message)
            return
          }
          
          // If viewing from business context and we got a permission error, 
          // try one more time with a different approach - check if connection exists first
          if (portfolioError.code === 'PGRST301' || portfolioError.message?.includes('permission') || portfolioError.message?.includes('RLS')) {
            console.log('[View Portfolio] Permission error for business viewer, checking connection status...')
            // Connection status check will happen later in the code, but we'll log this for debugging
          }
        }

        // Note: Don't set meta to null here if viewing from business context
        // The connection status check below will handle retrying and setting meta appropriately
        if (!portfolioData) {
          console.warn('[View Portfolio] No portfolio data found for talent:', viewTalentId || 'self')
          
          // If viewing from business context, connection status check will retry loading
          // If not viewing from business context (self-view), set meta to null now
          if (!viewTalentId && !cancelled) {
            setMeta(null)
            return
          }
          
          // For business context, continue to connection status check which will handle retry
          console.log('[View Portfolio] Portfolio not found. Will check connection status and retry if connection is accepted.')
        }

        // Don't check if portfolioData exists here - we need to check connection status first
        // This allows the retry logic to work if there's an accepted connection
        // The check will happen after connection status is verified
        let saved: any = null
        if (portfolioData?.metadata) {
          saved = portfolioData.metadata as any
          if (typeof saved !== 'object') {
            console.warn('[View Portfolio] Portfolio metadata is invalid:', saved)
            saved = null
          }
        }
        
        // If we have valid portfolio data, continue with loading it
        // Otherwise, we'll check connection status and retry before setting meta to null
        if (!saved || !portfolioData) {
          // Portfolio data not found yet - check connection status first to see if we can retry
          console.log('[View Portfolio] No portfolio data found yet. Checking connection status for retry...')
        } else {
          // We have valid portfolio data, continue with normal flow
          console.log('[View Portfolio] ✅ Portfolio data found, continuing with load...')
        }

        // Only process portfolio data if we have valid saved data
        // Otherwise, check connection status first (which might retry loading)
        if (saved && portfolioData) {
          // Debug: Log ALL sections with attachments to verify data structure
          console.log('[View Portfolio] Loaded portfolio metadata:', {
            hasEducation: Array.isArray(saved?.education),
            educationCount: Array.isArray(saved?.education) ? saved.education.length : 0,
            hasProjects: Array.isArray(saved?.projects),
            projectCount: Array.isArray(saved?.projects) ? saved.projects.length : 0,
            hasExperience: Array.isArray(saved?.experience),
            experienceCount: Array.isArray(saved?.experience) ? saved.experience.length : 0,
          })

          // Debug: Log education data to verify attachmentIds are present
          if (Array.isArray(saved?.education) && saved.education.length > 0) {
            console.log('[View Portfolio] Loaded education data:', saved.education.map((e: any, i: number) => ({
              index: i,
              institution: e?.institution,
              degree: e?.degree,
              attachmentIds: e?.attachmentIds,
              attachmentIdsType: typeof e?.attachmentIds,
              attachmentIdsIsArray: Array.isArray(e?.attachmentIds),
              attachmentIdsLength: Array.isArray(e?.attachmentIds) ? e.attachmentIds.length : 0,
            })))
          }

          // Debug: Log projects data
          if (Array.isArray(saved?.projects) && saved.projects.length > 0) {
            console.log('[View Portfolio] Loaded projects data:', saved.projects.map((p: any, i: number) => ({
              index: i,
              name: p?.name,
              attachmentIds: p?.attachmentIds,
              attachmentIdsType: typeof p?.attachmentIds,
              attachmentIdsIsArray: Array.isArray(p?.attachmentIds),
              attachmentIdsLength: Array.isArray(p?.attachmentIds) ? p.attachmentIds.length : 0,
            })))
          }

          if (!cancelled) setMeta(saved)
        }

        // Load connection request status and determine if business initiated it
        // Check for connection even if requestId is not in URL (for accepted connections)
        let connReqRes: any = null // Declare outside try block so it's accessible later
        if (viewTalentId) {
          try {
            const { data: sessionRes } = await supabase.auth.getSession()
            const currentUserId = sessionRes.session?.user?.id
            
            // Get business profile to check if this request was initiated by current business
            let currentBusinessId: string | null = null
            if (currentUserId) {
              const businessRes = await supabase
                .from('business_profiles')
                .select('id')
                .eq('user_id', currentUserId)
                .maybeSingle()
              
              if (!businessRes.error && businessRes.data) {
                currentBusinessId = businessRes.data.id
              }
            }
            
            // If we have a requestId, use it; otherwise, find the connection by business_id and talent_id
            if (requestId) {
              connReqRes = await supabase
                .from('talent_connection_requests')
                .select('id, status, business_id, talent_id')
                .eq('id', requestId)
                .maybeSingle()
              // Store connection request ID from URL parameter
              if (requestId && !cancelled) {
                setConnectionRequestId(requestId)
              }
            } else if (currentBusinessId && viewTalentId) {
              // No requestId in URL, but check if there's an accepted connection
              connReqRes = await supabase
                .from('talent_connection_requests')
                .select('id, status, business_id, talent_id')
                .eq('business_id', currentBusinessId)
                .eq('talent_id', viewTalentId)
                .eq('status', 'accepted')
                .order('responded_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            }
            
            if (connReqRes && !connReqRes.error && connReqRes.data) {
              // Store connection request ID for Messages and Video Chat buttons
              if (connReqRes.data.id) {
                setConnectionRequestId(connReqRes.data.id)
              }
              
              if (connReqRes.data.status) {
                setConnectionStatus(connReqRes.data.status)
              } else {
                setConnectionStatus('pending') // Default to pending if status is null
              }
              
              // Fetch talent name for display in video chat
              try {
                const talentNameRes = await supabase
                  .from('talent_profiles')
                  .select('name, title')
                  .eq('id', connReqRes.data.talent_id)
                  .maybeSingle()
                
                if (!talentNameRes.error && talentNameRes.data) {
                  const name = talentNameRes.data.name || talentNameRes.data.title || 'Talent'
                  setTalentName(name)
                }
              } catch (err) {
                console.error('[View Portfolio] Error loading talent name:', err)
              }
              
              // Check if this request was initiated by the current business
              if (currentBusinessId && connReqRes.data.business_id === currentBusinessId) {
                setIsBusinessInitiated(true)
                
                // Load talent summary for business-initiated requests (like from Business Map)
                // Check if status is pending (or null/empty, which defaults to pending)
                const isPending = !connReqRes.data.status || connReqRes.data.status === 'pending'
                if (isPending) {
                  try {
                    const talentRes = await supabase
                      .from('talent_profiles')
                      .select('id, title, experience_years, skills, city, state, country, search_summary, availability_description')
                      .eq('id', connReqRes.data.talent_id)
                      .maybeSingle()
                    
                    if (!talentRes.error && talentRes.data) {
                      setTalentSummary(talentRes.data)
                      // Also set talent name from this query if not already set
                      if (!talentName && talentRes.data.title) {
                        setTalentName(talentRes.data.title)
                      }
                    }
                  } catch (err) {
                    console.error('[View Portfolio] Error loading talent summary:', err)
                  }
                }
              } else {
                setIsBusinessInitiated(false)
              }
              
              // If we have an accepted connection but no portfolio data yet, try reloading the portfolio
              // This handles the case where RLS might have blocked the initial query but should allow it now
              if (connReqRes.data.status === 'accepted' && !portfolioData && !cancelled && targetUserId) {
                console.log('[View Portfolio] Accepted connection found, retrying portfolio load...')
                try {
                  const retryRes = await supabase
                    .from('talent_bank_items')
                    .select('id, metadata, created_at')
                    .eq('user_id', targetUserId)
                    .eq('item_type', 'portfolio')
                    .order('created_at', { ascending: false })
                    .limit(1)
                  
                  if (!retryRes.error && retryRes.data && retryRes.data[0]) {
                    console.log('[View Portfolio] ✅ Successfully loaded portfolio on retry after connection verification')
                    portfolioData = retryRes.data[0]
                    const savedRetry = (portfolioData?.metadata ?? null) as any
                    if (savedRetry && typeof savedRetry === 'object' && !cancelled) {
                      setMeta(savedRetry)
                      return // Exit early since we successfully loaded the portfolio
                    }
                  } else if (retryRes.error) {
                    console.error('[View Portfolio] ❌ Portfolio retry failed:', retryRes.error)
                    console.error('[View Portfolio] Error code:', retryRes.error.code)
                    console.error('[View Portfolio] Error message:', retryRes.error.message)
                    
                    if (retryRes.error.code === 'PGRST301' || retryRes.error.code === '42501' || retryRes.error.message?.includes('permission')) {
                      console.error('[View Portfolio] ⚠️ RLS POLICY ISSUE: The migration 2025122511_allow_business_view_connected_talent_portfolios.sql needs to be run!')
                      // Set error to show user what's wrong
                      if (!cancelled) {
                        setError('Portfolio access is blocked. Please ensure the RLS policy migration has been run.')
                        setMeta(null)
                        return
                      }
                    }
                  } else {
                    console.warn('[View Portfolio] Portfolio not found in database for this talent.')
                  }
                } catch (retryErr) {
                  console.error('[View Portfolio] Error retrying portfolio load:', retryErr)
                }
              }
            } else if (connReqRes && !connReqRes.error && !connReqRes.data) {
              // Request not found, but set status to pending anyway to show buttons
              setConnectionStatus('pending')
            }
          } catch (err) {
            console.error('[View Portfolio] Error loading connection request status:', err)
            // On error, default to pending so buttons are shown
            setConnectionStatus('pending')
          }
          
          // If we still don't have portfolio data after all checks, set meta to null to show empty state
          if (!portfolioData && !cancelled) {
            // Get the latest connection status from the query result
            const currentStatus = connReqRes && !connReqRes.error && connReqRes.data ? connReqRes.data.status : connectionStatus
            
            console.log('[View Portfolio] No portfolio data found after all attempts.')
            console.log('[View Portfolio] Connection status:', currentStatus || 'not checked')
            console.log('[View Portfolio] Target user_id:', targetUserId)
            console.log('[View Portfolio] Talent id:', viewTalentId)
            
            if (currentStatus === 'accepted' || connectionStatus === 'accepted') {
              console.error('[View Portfolio] ⚠️ CRITICAL: Accepted connection exists but portfolio still not loading!')
              console.error('[View Portfolio] ⚠️ Possible reasons:')
              console.error('[View Portfolio] ⚠️ 1. The portfolio doesn\'t exist for this talent yet (user_id:', targetUserId, ')')
              console.error('[View Portfolio] ⚠️ 2. The portfolio exists but the user_id in talent_bank_items doesn\'t match')
              console.error('[View Portfolio] ⚠️ 3. Check if talent_bank_items has an entry with item_type=\'portfolio\' and user_id=', targetUserId)
              
              // Show a helpful error message
              if (!cancelled) {
                setError(`Portfolio not found. The talent may not have created a portfolio yet, or there may be a data mismatch. (user_id: ${targetUserId})`)
              }
            }
            setMeta(null)
          }
        }

        // Define targetUserForFiles early so it's available for both portfolio and intro video loading
        // Use targetUserId for banner/avatar/video paths (not uid, which might be the business user)
        const targetUserForFiles = targetUserId || uid
        
        // Only load banner/avatar if we have valid portfolio data
        if (saved && portfolioData) {
          // When viewing from business context, prefer public URLs (bucket should be public)
          const usePublic = !!viewTalentId
          const [b, a] = await Promise.all([
            signedUrl(String(saved.banner_path ?? ''), 60 * 30, usePublic),
            signedUrl(String(saved.avatar_path ?? ''), 60 * 30, usePublic),
          ])
          if (!cancelled) {
            setBannerUrl(b)
            setAvatarUrl(a)
          }
        } else {
          // No portfolio data yet - connection check will retry, then set meta to null if still no data
          console.log('[View Portfolio] Skipping banner/avatar load - no portfolio data yet')
        }

        // Intro video (picked in Portfolio editor)
        // Only load intro video if we have valid portfolio data
        // IMPORTANT: When viewing from connection request, we should still try to load intro video
        // even if it's not in selected_sections, as it's part of the portfolio display
        if (saved && portfolioData && targetUserForFiles) {
          const introId = typeof saved.introVideoId === 'number' ? saved.introVideoId : null
          console.log('[View Portfolio] Loading intro video:', { 
            introId, 
            targetUserForFiles, 
            targetUserId,
            viewTalentId, 
            requestId,
            savedKeys: Object.keys(saved),
            savedIntroVideoId: saved?.introVideoId,
            portfolioDataExists: !!portfolioData
          })
          
          // Helper function to load video from data
          const loadVideoFromData = async (videoData: any) => {
            const filePath = videoData?.file_path as string | null
            const fileUrl = videoData?.file_url as string | null
            
            if (filePath) {
              // When viewing from business context, use public URL directly
              if (viewTalentId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
                const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-bank/${encodeURIComponent(filePath)}`
                if (!cancelled) {
                  setIntroVideoUrl(publicUrl)
                  setIntroVideoTitle(videoData?.title || 'Introduction Video')
                }
              } else {
                // Try signed URL first
                const { data: urlData, error: urlError } = await supabase.storage.from('talent-bank').createSignedUrl(filePath, 60 * 30)
                if (!cancelled) {
                  if (urlError) {
                    console.warn('[View Portfolio] Signed URL failed for intro video, trying public URL:', urlError.message)
                    // Fallback to public URL
                    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
                      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-bank/${encodeURIComponent(filePath)}`
                      setIntroVideoUrl(publicUrl)
                    }
                  } else {
                    setIntroVideoUrl(urlData?.signedUrl ?? null)
                  }
                  setIntroVideoTitle(videoData?.title || 'Introduction Video')
                }
              }
            } else if (fileUrl) {
              // If file_url is provided (for linked videos like YouTube), use it directly
              if (!cancelled) {
                setIntroVideoUrl(fileUrl)
                setIntroVideoTitle(videoData?.title || 'Introduction Video')
              }
            }
          }
          
          if (introId) {
            try {
              const vidRow = await supabase
              .from('talent_bank_items')
              .select('id,title,file_path,file_type,item_type,file_url')
              .eq('user_id', targetUserForFiles)
              .eq('id', introId)
                .maybeSingle()
              
              console.log('[View Portfolio] Intro video query result:', { 
                error: vidRow.error, 
                data: vidRow.data,
                targetUserForFiles,
                introId
              })
              
              if (vidRow.error) {
                console.error('[View Portfolio] Error loading intro video item:', vidRow.error)
                // Check if it's a permission/RLS error or not found error
                const isNotFound = vidRow.error.code === 'PGRST116' || vidRow.error.message?.includes('not found')
                const isPermissionError = vidRow.error.code === 'PGRST301' || vidRow.error.message?.includes('permission') || vidRow.error.message?.includes('RLS')
                
                if (isNotFound || isPermissionError) {
                  console.log('[View Portfolio] Video not found or permission denied, trying to find by item_type...', { isNotFound, isPermissionError })
                  const fallbackVid = await supabase
                    .from('talent_bank_items')
                    .select('id,title,file_path,file_type,item_type,file_url')
                    .eq('user_id', targetUserForFiles)
                    .or('item_type.eq.intro_video,item_type.eq.business_introduction,item_type.eq.video')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                  
                  console.log('[View Portfolio] Fallback video query result:', { error: fallbackVid.error, data: fallbackVid.data })
                  
                  if (!fallbackVid.error && fallbackVid.data) {
                    console.log('[View Portfolio] Found intro video via fallback:', fallbackVid.data)
                    await loadVideoFromData(fallbackVid.data)
                    return
                  } else if (fallbackVid.error) {
                    console.error('[View Portfolio] Fallback video query also failed:', fallbackVid.error)
                  }
                }
              } else if (vidRow.data) {
                await loadVideoFromData(vidRow.data)
              } else if (!cancelled) {
                setIntroVideoUrl(null)
                setIntroVideoTitle('Introduction Video (file not found)')
              }
            } catch (err) {
              console.error('[View Portfolio] Error loading intro video:', err)
              if (!cancelled) {
                setIntroVideoUrl(null)
                setIntroVideoTitle('Introduction Video (file not found)')
              }
            }
            } else {
            // No intro video ID in metadata - try to find any intro video
            console.log('[View Portfolio] No introVideoId in metadata, searching for intro video...', {
              targetUserForFiles,
              viewTalentId,
              requestId
            })
            try {
              // Try multiple item_type values that might contain intro videos
              const fallbackVid = await supabase
                .from('talent_bank_items')
                .select('id,title,file_path,file_type,item_type,file_url')
                .eq('user_id', targetUserForFiles)
                .in('item_type', ['intro_video', 'business_introduction', 'video'])
                .order('created_at', { ascending: false })
                .limit(5)
              
              console.log('[View Portfolio] Fallback video search result:', { 
                error: fallbackVid.error, 
                data: fallbackVid.data,
                count: fallbackVid.data?.length || 0
              })
              
              // Find the first video item (not portfolio metadata)
              const videoItem = fallbackVid.data?.find((item: any) => 
                item.item_type !== 'portfolio' && (item.file_path || item.file_url)
              )
              
              if (videoItem) {
                console.log('[View Portfolio] Found video item in fallback search:', videoItem)
                await loadVideoFromData(videoItem)
              } else if (!fallbackVid.error && fallbackVid.data && fallbackVid.data.length > 0) {
                // If we found items but no video, log what we found
                console.log('[View Portfolio] Found items but no video:', fallbackVid.data.map((i: any) => ({
                  id: i.id,
                  item_type: i.item_type,
                  has_file_path: !!i.file_path,
                  has_file_url: !!i.file_url
                })))
                if (!cancelled) {
                  setIntroVideoUrl(null)
                  setIntroVideoTitle(null)
                }
              } else if (!cancelled) {
                setIntroVideoUrl(null)
                setIntroVideoTitle(null)
              }
            } catch (err) {
              console.error('[View Portfolio] Error searching for intro video:', err)
              if (!cancelled) {
                setIntroVideoUrl(null)
                setIntroVideoTitle(null)
              }
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    
    // Reload when page becomes visible to pick up latest saves from Edit Portfolio
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        load()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [viewTalentId, requestId])

  function normalizeDisplayText(s: string) {
    // Prevent large vertical gaps from extra blank lines (often created during edits/deletes/imports).
    return String(s || '')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const sectionOrder = useMemo(() => {
    const raw = safeArray<string>(meta?.sectionOrder)
    const fallback = ['skills', 'experience', 'education', 'referees', 'projects', 'personal_documents', 'licences_accreditations', 'attachments']
    const merged = raw.length ? [...raw] : [...fallback]
    for (const k of fallback) {
      if (!merged.includes(k)) merged.push(k)
    }
    return merged
  }, [meta])
  const skills = useMemo(() => safeArray<string>(meta?.skills).map((s) => String(s || '').trim()).filter(Boolean), [meta])
  const experience = useMemo(() => {
    const raw = safeArray<any>(meta?.experience)
    return raw
      .map((e) => {
        // Preserve attachmentIds
        const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
          const num = Number(id)
          return Number.isFinite(num) && num > 0
        }).map((id: any) => Number(id)) : []
        
        return {
          ...e,
          attachmentIds: attachmentIds,
        }
      })
      .filter((e) => {
        const title = String(e?.role || e?.title || '').trim()
        const company = String(e?.company || e?.organisation || '').trim()
        const desc = normalizeDisplayText(String(e?.description || ''))
        const hasAttachments = Array.isArray(e.attachmentIds) && e.attachmentIds.length > 0
        return !!(title || company || desc || hasAttachments)
      })
  }, [meta])
  const education = useMemo(() => {
    const raw = safeArray<any>(meta?.education)
    if (!raw.length) return []
    
    const processed = raw.map((e, idx) => {
      // Extract attachmentIds - handle various formats
      let attachmentIds: number[] = []
      if (Array.isArray(e?.attachmentIds)) {
        attachmentIds = e.attachmentIds.filter((id: any) => {
          const num = Number(id)
          return Number.isFinite(num) && num > 0
        }).map((id: any) => Number(id))
      } else if (e?.attachmentIds != null) {
        // Handle single value or other formats
        const num = Number(e.attachmentIds)
        if (Number.isFinite(num) && num > 0) {
          attachmentIds = [num]
        }
      }
      
      const inst = String(e?.institution || e?.school || '').trim()
      const degree = String(e?.qualification || e?.degree || '').trim()
      const notes = normalizeDisplayText(String(e?.notes || ''))
      const year = String(e?.year || e?.endYear || '').trim()
      
      // Debug log for all education entries
      if (attachmentIds.length > 0) {
        console.log(`[View Portfolio] Education entry ${idx} has ${attachmentIds.length} attachments:`, {
          entryIndex: idx,
          institution: inst,
          degree: degree,
          rawAttachmentIds: e?.attachmentIds,
          processedAttachmentIds: attachmentIds,
          attachmentIdsType: typeof e?.attachmentIds,
          isArray: Array.isArray(e?.attachmentIds),
        })
      } else if (idx === 0) {
        // Log first entry even if no attachments to verify data structure
        console.log(`[View Portfolio] Education entry ${idx} (no attachments):`, {
          entryIndex: idx,
          institution: inst,
          degree: degree,
          rawAttachmentIds: e?.attachmentIds,
          hasAttachmentIdsKey: 'attachmentIds' in e,
          attachmentIdsValue: e?.attachmentIds,
        })
      }
      
      return {
        ...e, // Preserve all original fields first
        institution: inst,
        degree: degree,
        qualification: degree,
        school: inst,
        notes: notes,
        year: year,
        endYear: year,
        attachmentIds: attachmentIds, // Explicitly set attachmentIds as array
      }
    })
    
    return processed.filter((e) => {
      // Include if at least one field has content OR has attachments
      const hasContent = !!(e.institution || e.degree || e.notes || e.year)
      const hasAttachments = Array.isArray(e.attachmentIds) && e.attachmentIds.length > 0
      return hasContent || hasAttachments
    })
  }, [meta])
  const referees = useMemo(() => {
    // View Portfolio must show ALL saved referees from Edit Portfolio
    // Show any referee that has at least one field with content
    const raw = safeArray<any>(meta?.referees)
    const mapped = raw.map((r) => ({
      name: String(r?.name || '').trim(),
      relationship: String(r?.relationship || '').trim(),
      company: String(r?.company || '').trim(),
      title: String(r?.title || '').trim(),
      email: String(r?.email || '').trim(),
      phone: String(r?.phone || '').trim(),
      notes: normalizeDisplayText(String(r?.notes || '')),
      attachmentIds: Array.isArray(r?.attachmentIds) ? r.attachmentIds : [],
    }))
    // Include if at least one field has content - but be more lenient
    // Include if name exists OR any other field has content
    return mapped.filter((r) => {
      return !!(r.name || r.notes || r.email || r.phone || r.title || r.company || r.relationship)
    })
  }, [meta])
  const projects = useMemo(() => {
    // View Portfolio must show ALL saved projects from Edit Portfolio
    // Show any project that has at least one field with content
    const raw = safeArray<any>(meta?.projects)
    return raw
      .map((p) => ({
        name: String(p?.name || '').trim(),
        url: String(p?.url || '').trim(),
        description: normalizeDisplayText(String(p?.description || '')),
        attachmentIds: Array.isArray(p?.attachmentIds) ? p.attachmentIds : [],
      }))
      .filter((p) => {
        // Include if at least one field has content (same as before, but more explicit)
        return !!(p.name || p.url || p.description || (p.attachmentIds && p.attachmentIds.length > 0))
      })
  }, [meta])
  const personalDocuments = useMemo(() => {
    const raw = safeArray<any>(meta?.personal_documents)
    return raw
      .map((doc) => ({
        title: String(doc?.title || '').trim(),
        description: normalizeDisplayText(String(doc?.description || '')),
        attachmentIds: Array.isArray(doc?.attachmentIds) ? doc.attachmentIds.filter((id: any) => {
          const num = Number(id)
          return Number.isFinite(num) && num > 0
        }).map((id: any) => Number(id)) : [],
      }))
      .filter((doc) => {
        return !!(doc.title || doc.description || (doc.attachmentIds && doc.attachmentIds.length > 0))
      })
  }, [meta])
  const licencesAccreditations = useMemo(() => {
    const raw = safeArray<any>(meta?.licences_accreditations)
    return raw
      .map((lic) => ({
        title: String(lic?.title || '').trim(),
        issuer: String(lic?.issuer || '').trim(),
        issueDate: String(lic?.issueDate || '').trim(),
        expiryDate: String(lic?.expiryDate || '').trim(),
        description: normalizeDisplayText(String(lic?.description || '')),
        attachmentIds: Array.isArray(lic?.attachmentIds) ? lic.attachmentIds.filter((id: any) => {
          const num = Number(id)
          return Number.isFinite(num) && num > 0
        }).map((id: any) => Number(id)) : [],
      }))
      .filter((lic) => {
        return !!(lic.title || lic.issuer || lic.issueDate || lic.expiryDate || lic.description || (lic.attachmentIds && lic.attachmentIds.length > 0))
      })
  }, [meta])
  const familyCommunityImageIds = useMemo(() => {
    const raw = safeArray<number>(meta?.family_community?.imageIds || (meta?.familyCommunity as any)?.imageIds || [])
    return raw.filter((id: any) => {
      const num = Number(id)
      return Number.isFinite(num) && num > 0
    }).map((id: any) => Number(id))
  }, [meta])
  const attachments = useMemo(() => safeArray<any>(meta?.attachments), [meta])

  const socialLinks = useMemo<SocialLink[]>(() => {
    const m: any = meta ?? {}
    const list: SocialLink[] = []

    // Preferred shape: socialLinks: [{platform,url}]
    const raw = Array.isArray(m.socialLinks) ? m.socialLinks : []
    for (const it of raw) {
      const platform = String((it as any)?.platform ?? '').trim()
      const url = String((it as any)?.url ?? '').trim()
      if (!platform || !url) continue
      list.push({ platform, url })
    }

    // Back-compat: single fields
    const legacy: Array<[string, string | null | undefined]> = [
      ['LinkedIn', m.linkedin || m.linkedIn || m?.social?.linkedin || m?.socials?.linkedin || null],
      ['GitHub', m.github || m?.social?.github || null],
      ['YouTube', m.youtube || m?.social?.youtube || null],
      ['Website', m.website || m?.site || null],
      ['X', m.twitter || m.x || null],
      ['Instagram', m.instagram || null],
      ['Facebook', m.facebook || null],
      ['TikTok', m.tiktok || null],
      ['Behance', m.behance || null],
      ['Dribbble', m.dribbble || null],
    ]
    for (const [platform, url0] of legacy) {
      const url = String(url0 || '').trim()
      if (!url) continue
      if (list.some((x) => String(x.platform).toLowerCase() === platform.toLowerCase())) continue
      list.push({ platform, url })
    }

    // Dedupe by platform+url
    const seen = new Set<string>()
    const out: SocialLink[] = []
    for (const it of list) {
      const key = `${String(it.platform).toLowerCase()}|${String(it.url).toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(it)
    }
    return out
  }, [meta])

  const title = (typeof meta?.title === 'string' && meta.title) || 'Your Portfolio'
  const name = (typeof meta?.name === 'string' && meta.name) || 'Talent'
  const bio = normalizeDisplayText((typeof meta?.bio === 'string' && meta.bio) || '')
  const location =
    (typeof (meta as any)?.location === 'string' && (meta as any).location) ||
    (typeof (meta as any)?.city === 'string' && (meta as any).city) ||
    ''

  const yearsExperience = useMemo(() => {
    const years: number[] = []
    for (const e of experience) {
      const s = String(e?.startDate ?? e?.start_date ?? '')
      const m = s.match(/\b(19|20)\d{2}\b/)
      if (m) years.push(Number(m[0]))
    }
    if (!years.length) return null
    const minYear = Math.min(...years)
    const nowYear = new Date().getFullYear()
    const diff = Math.max(0, nowYear - minYear)
    return diff >= 1 ? `${diff}+ Years Experience` : '1+ Years Experience'
  }, [experience])

  useEffect(() => {
    let cancelled = false
    async function loadAttachments() {
      if (!userId) return
      const ids = new Set<number>()
      
      // Load project attachments
      for (const p of projects) {
        const a = safeArray<any>((p as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load education attachments
      for (const e of education) {
        const a = safeArray<any>((e as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load experience attachments
      for (const e of experience) {
        const a = safeArray<any>((e as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load personal documents attachments
      for (const doc of personalDocuments) {
        const a = safeArray<any>((doc as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load licences and accreditations attachments
      for (const lic of licencesAccreditations) {
        const a = safeArray<any>((lic as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      // Load family and community images
      for (const id of familyCommunityImageIds) {
        const n = Number(id)
        if (Number.isFinite(n) && n > 0) ids.add(n)
      }
      
      // Load referee attachments
      for (const r of referees) {
        const a = safeArray<any>((r as any)?.attachmentIds)
        for (const id of a) {
          const n = Number(id)
          if (Number.isFinite(n) && n > 0) ids.add(n)
        }
      }
      
      const missing = Array.from(ids).filter((id) => !tbItemCache[id])
      if (!missing.length) return

      // userId should already be set to the target user's ID (talent's user_id when viewing from business context)
      if (!userId) {
        console.warn('[View Portfolio] No userId for loading attachments')
        return
      }

      console.log('[View Portfolio] Loading attachments for user_id:', userId, 'missing IDs:', Array.from(missing))
      const { data, error } = await supabase
        .from('talent_bank_items')
        .select('id,item_type,title,metadata,file_path,file_type,file_url')
        .eq('user_id', userId)
        .in('id', missing)

      if (error) {
        console.error('[View Portfolio] Error loading attachments:', error)
        // Don't return - try to continue with what we have
      }

      if (cancelled) return
      const next: Record<number, any> = {}
      for (const it of data ?? []) next[(it as any).id] = it
      if (Object.keys(next).length) {
        setTbItemCache((prev) => ({ ...prev, ...next }))
      }
    }
    loadAttachments()
    return () => {
      cancelled = true
    }
  }, [userId, projects, education, experience, referees, personalDocuments, licencesAccreditations, tbItemCache])

  function clampStyle(lines = 5) {
    // Reliable 5-line clamp without depending on Tailwind line-clamp utilities/plugins.
    return {
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical' as const,
      WebkitLineClamp: lines,
      overflow: 'hidden',
    }
  }

  function iconSvg(platform: string) {
    const p = String(platform || '').toLowerCase()
    const common = 'w-5 h-5'
    if (p.includes('linkedin')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0.5 8.5H4.5V24H0.5V8.5zM8 8.5h3.8v2.1h.1c.5-.9 1.9-2.3 4-2.3C20 8.3 24 10.8 24 16.1V24h-4v-7c0-1.7 0-3.8-2.3-3.8-2.3 0-2.7 1.8-2.7 3.7V24H11V8.5H8z" />
        </svg>
      )
    }
    if (p.includes('github')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.73.5.75 5.6.75 12c0 5.15 3.44 9.53 8.21 11.07.6.12.82-.27.82-.6v-2.2c-3.34.74-4.04-1.65-4.04-1.65-.55-1.43-1.35-1.81-1.35-1.81-1.1-.77.08-.76.08-.76 1.22.09 1.86 1.28 1.86 1.28 1.08 1.9 2.84 1.35 3.53 1.03.11-.81.42-1.35.77-1.66-2.67-.31-5.48-1.37-5.48-6.1 0-1.35.47-2.45 1.24-3.31-.12-.31-.54-1.58.12-3.29 0 0 1.01-.33 3.3 1.26a11.1 11.1 0 0 1 3-.42c1.02 0 2.04.14 3 .42 2.29-1.6 3.3-1.26 3.3-1.26.66 1.71.24 2.98.12 3.29.77.86 1.24 1.96 1.24 3.31 0 4.74-2.82 5.78-5.5 6.09.43.38.82 1.13.82 2.28v3.38c0 .33.22.72.82.6C19.81 21.53 23.25 17.15 23.25 12c0-6.4-4.98-11.5-11.25-11.5z" />
        </svg>
      )
    }
    if (p.includes('youtube')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.5 6.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C16.88 2.5 12 2.5 12 2.5h-.01s-4.88 0-8.19.34c-.47.05-1.47.06-2.36 1C.73 4.56.5 6.2.5 6.2S.16 8.1.16 10v1.8c0 1.9.34 3.8.34 3.8s.23 1.64.94 2.36c.9.94 2.08.91 2.6 1.01 1.9.18 8.02.34 8.02.34s4.88-.01 8.19-.35c.47-.05 1.47-.06 2.36-1 .71-.72.94-2.36.94-2.36s.34-1.9.34-3.8V10c0-1.9-.34-3.8-.34-3.8zM9.75 14.7V7.8l6.5 3.46-6.5 3.44z" />
        </svg>
      )
    }
    if (p === 'x' || p.includes('twitter') || p.includes('x.com')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.7l-5.2-6.8L5.9 22H2.8l7.3-8.4L.8 2h6.9l4.7 6.2L18.9 2zm-1.2 18h1.7L6.6 3.9H4.8L17.7 20z" />
        </svg>
      )
    }
    if (p.includes('instagram')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5zM18 6.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
        </svg>
      )
    }
    if (p.includes('facebook')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.87.24-1.46 1.49-1.46H16.7V5c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.21 1.52-4.21 4.3V11H7.3v3h2.66v8h3.54z" />
        </svg>
      )
    }
    if (p.includes('tiktok')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.7 3c.4 3 2.4 4.8 5.3 5v3.3c-1.8.1-3.4-.5-4.9-1.5v6.8c0 3.9-3.2 7.1-7.1 7.1S2.9 20.5 2.9 16.6s3.2-7.1 7.1-7.1c.4 0 .8 0 1.2.1v3.6c-.4-.1-.8-.2-1.2-.2-2 0-3.6 1.6-3.6 3.6S8 20.2 10 20.2s3.6-1.6 3.6-3.6V3h3.1z" />
        </svg>
      )
    }
    if (p.includes('behance')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8.2 11.2c.9-.5 1.4-1.3 1.4-2.4 0-2-1.5-3.1-4-3.1H0v12.6h5.9c2.7 0 4.4-1.3 4.4-3.6 0-1.5-.7-2.7-2.1-3.5zM3.1 8h2.6c1 0 1.6.4 1.6 1.3 0 1-.6 1.4-1.7 1.4H3.1V8zm2.9 7.7H3.1v-2.8h2.8c1.2 0 1.9.5 1.9 1.4 0 1-.7 1.4-1.8 1.4zm10.7-7.9c-2.7 0-4.6 2.1-4.6 5.2 0 3.3 1.8 5.3 4.7 5.3 2.1 0 3.7-1.1 4.2-3.1h-2.2c-.2.7-.8 1.1-1.8 1.1-1.2 0-2-.8-2-2.2h6.1c.1-3.7-1.6-6.3-4.4-6.3zM14.6 12c.1-1.2.8-2 1.9-2 1.2 0 1.8.8 1.9 2h-3.8zM14 5.2h5V7h-5V5.2z" />
        </svg>
      )
    }
    if (p.includes('dribbble')) {
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5A9.5 9.5 0 1 0 21.5 12 9.51 9.51 0 0 0 12 2.5zm7.9 8.3a15.2 15.2 0 0 1-5.2.1c-.2-.5-.4-1-.7-1.6a15.1 15.1 0 0 0 3.8-3.2 7.9 7.9 0 0 1 2.1 4.7zM12 4.1a7.9 7.9 0 0 1 4.3 1.3 13.3 13.3 0 0 1-3.4 2.9A36.6 36.6 0 0 0 10 4.4c.6-.2 1.3-.3 2-.3zM8.1 5.2a34.4 34.4 0 0 1 3 3.9 14.9 14.9 0 0 1-6.2.8 7.9 7.9 0 0 1 3.2-4.7zM4.1 12v-.2a16.8 16.8 0 0 0 7.9-1.1c.2.4.4.8.5 1.1l-.3.1a16.9 16.9 0 0 0-6.9 5.4A7.9 7.9 0 0 1 4.1 12zm7.9 7.9a7.9 7.9 0 0 1-4.9-1.7 15.2 15.2 0 0 1 6.3-5c.6 1.7 1.1 3.5 1.3 5.5a7.8 7.8 0 0 1-2.7 1.2zm4.3-2.3a24.6 24.6 0 0 0-1.1-4.7 12 12 0 0 0 4.6-.2 7.9 7.9 0 0 1-3.5 4.9z" />
        </svg>
      )
    }
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a3 3 0 1 1 4.2 4.2l-1.7 1.7a1 1 0 1 1-1.4-1.4l1.7-1.7a1 1 0 1 0-1.4-1.4l-3.5 3.5a1 1 0 0 1-1.4 0z" />
        <path d="M13.4 10.6a1 1 0 0 1 0 1.4l-3.5 3.5a3 3 0 1 1-4.2-4.2l1.7-1.7a1 1 0 1 1 1.4 1.4l-1.7 1.7a1 1 0 1 0 1.4 1.4l3.5-3.5a1 1 0 0 1 1.4 0z" />
      </svg>
    )
  }

  function SocialIconBar({ links, className }: { links: SocialLink[]; className?: string }) {
    if (!links?.length) return null

    const colorClass = (platform: string) => {
      const p = String(platform || '').toLowerCase()
      if (p.includes('linkedin')) return 'bg-sky-500/15 border-sky-400/30 text-sky-200 hover:bg-sky-500/25'
      if (p.includes('youtube')) return 'bg-red-500/15 border-red-400/30 text-red-200 hover:bg-red-500/25'
      if (p.includes('instagram')) return 'bg-pink-500/15 border-pink-400/30 text-pink-200 hover:bg-pink-500/25'
      if (p.includes('github')) return 'bg-slate-200/10 border-slate-200/20 text-slate-100 hover:bg-slate-200/15'
      if (p === 'x' || p.includes('twitter') || p.includes('x.com')) return 'bg-neutral-200/10 border-neutral-200/20 text-neutral-100 hover:bg-neutral-200/15'
      if (p.includes('facebook')) return 'bg-blue-500/15 border-blue-400/30 text-blue-200 hover:bg-blue-500/25'
      if (p.includes('tiktok')) return 'bg-fuchsia-500/12 border-fuchsia-400/25 text-fuchsia-200 hover:bg-fuchsia-500/18'
      if (p.includes('behance')) return 'bg-indigo-500/15 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/25'
      if (p.includes('dribbble')) return 'bg-rose-500/15 border-rose-400/30 text-rose-200 hover:bg-rose-500/25'
      if (p.includes('website') || p.includes('portfolio')) return 'bg-emerald-500/12 border-emerald-400/25 text-emerald-200 hover:bg-emerald-500/18'
      return 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
    }

    return (
      <div className={className || ''}>
        <div className="flex flex-wrap gap-2">
          {links.map((l, idx) => (
            <a
              key={`${l.platform}-${idx}`}
              href={(() => {
                const u = String(l.url || '').trim()
                if (!u) return '#'
                if (/^https?:\/\//i.test(u)) return u
                return `https://${u.replace(/^\/+/, '')}`
              })()}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${colorClass(String(l.platform))}`}
              title={`${l.platform}: ${l.url}`}
            >
              {iconSvg(l.platform)}
              <span className="text-sm font-medium">{String(l.platform)}</span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  function fileExt(title: string) {
    const m = String(title || '').toLowerCase().match(/\.([a-z0-9]+)$/)
    return m?.[1] ?? ''
  }

  async function ensureSignedUrl(path: string) {
    if (!path) return
    if (thumbUrls[path]) return
    
    // When viewing from business context, use public URL directly
    if (viewTalentId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
      setThumbUrls((prev) => ({ ...prev, [path]: publicUrl }))
      return
    }
    
    const { data, error } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
    if (data?.signedUrl) {
      setThumbUrls((prev) => ({ ...prev, [path]: data.signedUrl }))
    } else if (error && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Fallback to public URL
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
      setThumbUrls((prev) => ({ ...prev, [path]: publicUrl }))
    }
  }

  async function openPath(path: string, fileType: string | null | undefined, title: string) {
    if (!path) return
    
    // When viewing from business context, use public URL directly
    let url: string | null = null
    if (viewTalentId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
    } else {
      const { data, error } = await supabase.storage.from('talent-bank').createSignedUrl(path, 60 * 30)
      url = data?.signedUrl ?? null
      if (!url && error && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Fallback to public URL
        url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/talent-bank/${encodeURIComponent(path)}`
      }
    }
    
    if (!url) return
    const ft = (fileType || '').toLowerCase()
    if (ft.includes('pdf')) {
      setPreview({ kind: 'pdf', url, title: title || 'Document' })
      return
    }
    window.open(url, '_blank')
  }

  function ThumbIcon({ label }: { label: string }) {
    return (
      <div className="w-full h-32 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <div className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-950/40 text-xs font-semibold text-slate-200">
          {label}
        </div>
      </div>
    )
  }

  function tbThumb(item: any) {
    const type = String(item?.item_type ?? '').toLowerCase()
    const ft = String(item?.file_type ?? '').toLowerCase()
    const title = String(item?.title ?? '')
    const path = String(item?.file_path ?? '')
    const isImg = ft.startsWith('image/')
    const isVid = ft.startsWith('video/')
    const isPdf = ft.includes('pdf') || title.toLowerCase().endsWith('.pdf')
    const label = isImg ? 'IMG' : isVid ? 'VID' : isPdf ? 'PDF' : (type ? type.toUpperCase().slice(0, 4) : 'FILE')

    if (path && (isImg || isVid) && !thumbUrls[path]) ensureSignedUrl(path).catch(() => {})
    const url = path ? thumbUrls[path] : null

    if (url && isImg) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={title} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
    }
    if (url && isVid) {
      return (
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
          <div className="text-white/80 text-sm">▶</div>
        </div>
      )
    }
    return (
      <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <div className="px-2 py-1 rounded-lg border border-white/10 bg-slate-950/40 text-[10px] font-semibold text-slate-200">
          {label}
        </div>
      </div>
    )
  }

  function isSupabaseSignedObjectUrl(u: string) {
    // Signed object URLs expire; don’t persist/reuse them for thumbnails.
    return u.includes('/storage/v1/object/sign/') || u.includes('token=')
  }

  function extractBucketObjectPathFromUrl(u: string): { bucket: string; path: string } | null {
    // Handles:
    // - /storage/v1/object/public/<bucket>/<path>
    // - /storage/v1/object/sign/<bucket>/<path>?token=...
    try {
      const url = new URL(u)
      const parts = url.pathname.split('/').filter(Boolean)
      const i = parts.findIndex((p) => p === 'object')
      if (i === -1) return null
      const visibility = parts[i + 1] // public|sign
      const bucket = parts[i + 2]
      const rest = parts.slice(i + 3).join('/')
      if (!visibility || !bucket || !rest) return null
      return { bucket, path: rest }
    } catch {
      return null
    }
  }

  function AttachmentThumb({ a }: { a: any }) {
    const isImg = String(a?.file_type || '').startsWith('image') || a?.item_type === 'image'
    const isVid = String(a?.file_type || '').startsWith('video') || a?.item_type === 'video'
    const ext = fileExt(String(a?.title || ''))
    const label = isImg ? 'IMG' : isVid ? 'VID' : ext ? ext.toUpperCase().slice(0, 4) : 'FILE'

    const rawUrl = typeof a?.url === 'string' ? String(a.url) : ''
    let path = String(a?.file_path || '')

    // If we only have a URL (often a stale signed URL), try to extract the bucket path.
    if (!path && rawUrl) {
      const extracted = extractBucketObjectPathFromUrl(rawUrl)
      if (extracted?.bucket === 'talent-bank' && extracted.path) path = extracted.path
    }

    const hasFresh = path ? !!thumbUrls[path] : false
    const shouldMintFresh = path && (isImg || isVid) && (!hasFresh || (rawUrl && isSupabaseSignedObjectUrl(rawUrl)))
    if (shouldMintFresh) ensureSignedUrl(path).catch(() => {})

    // Prefer a freshly minted signed URL when we have a path.
    // Avoid reusing stored signed URLs (they expire and cause broken thumbnails).
    const url = path ? thumbUrls[path] : rawUrl || null

    if (url && isImg) {
      return (
        <button
          type="button"
          className="w-full h-32 rounded-xl border border-white/10 overflow-hidden"
          onClick={() => setPreview({ kind: 'image', url, title: String(a?.title || 'Image') })}
          title="Click to expand"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Attachment image"
            className="w-full h-full object-cover"
            onError={() => {
              // If a thumbnail URL is stale, attempt a refresh once.
              if (path) ensureSignedUrl(path).catch(() => {})
            }}
          />
        </button>
      )
    }

    if (url && isVid) {
      return (
        <button
          type="button"
          className="w-full h-32 rounded-xl border border-white/10 overflow-hidden"
          onClick={() => setPreview({ kind: 'video', url, title: String(a?.title || 'Video') })}
          title="Click to play"
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

    // Documents/other: icon tile; clicking opens/preview via signed URL.
    if (path) {
      return (
        <button
          type="button"
          className="w-full"
          onClick={() => openPath(path, a?.file_type ?? null, String(a?.title || 'Document'))}
          title="Open"
        >
          <ThumbIcon label={label} />
        </button>
      )
    }

    return <ThumbIcon label={label} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {preview ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold truncate pr-4 text-slate-900">{preview.title}</div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-slate-900"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              {preview.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt="Preview" className="max-h-[75vh] w-auto object-contain" />
              ) : preview.kind === 'video' ? (
                <video src={preview.url} controls className="max-h-[75vh] w-auto object-contain" />
              ) : (
                <iframe title="Document preview" src={preview.url} className="w-full h-[75vh] bg-white rounded-lg" />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Family and Community Gallery Modal */}
      {familyCommunityGalleryOpen && familyCommunityImageIds.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 overflow-auto"
          onClick={() => setFamilyCommunityGalleryOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-7xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="text-xl font-semibold text-white">Family and Community</div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                onClick={() => setFamilyCommunityGalleryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="p-6 bg-slate-950">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {familyCommunityImageIds.map((imageId) => {
                  const item = tbItemCache[imageId]
                  if (!item) {
                    return (
                      <div key={imageId} className="aspect-square rounded-xl border border-white/10 bg-slate-800/50 flex items-center justify-center">
                        <div className="text-slate-400 text-sm">Loading...</div>
                      </div>
                    )
                  }
                  const path = String(item?.file_path ?? '')
                  const url = path ? thumbUrls[path] : null
                  if (path && !url) ensureSignedUrl(path).catch(() => {})
                  
                  if (url) {
                    return (
                      <button
                        key={imageId}
                        type="button"
                        onClick={() => setFamilyCommunityViewImage(imageId)}
                        className="aspect-square rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden hover:border-blue-400 transition-all cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={String(item?.title || 'Family and Community Image')}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )
                  }
                  return (
                    <div key={imageId} className="aspect-square rounded-xl border border-white/10 bg-slate-800/50 flex items-center justify-center">
                      <div className="text-slate-400 text-xs text-center px-2">{String(item?.title || 'Image')}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Family and Community Image View Modal with Description */}
      {familyCommunityViewImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setFamilyCommunityViewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-xl font-semibold text-gray-900">Family and Community</div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-gray-900"
                onClick={() => setFamilyCommunityViewImage(null)}
              >
                Close
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const item = tbItemCache[familyCommunityViewImage]
                const path = item?.file_path || ''
                const url = path ? thumbUrls[path] : null
                if (path && !url) ensureSignedUrl(path).catch(() => {})
                
                // Get description from meta data
                const description = (meta as any)?.family_community?.descriptions?.[familyCommunityViewImage] || ''
                
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
                    {description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-[100px] whitespace-pre-wrap">
                          {description}
                        </div>
                      </div>
                    )}
                    {!description && (
                      <div className="text-sm text-gray-500 italic text-center py-4">
                        No description available for this image.
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          {viewTalentId ? (
            <>
              <Link href="/dashboard/business?tab=connections" className="text-slate-300 hover:text-blue-400">
                ← Back to Business Dashboard
              </Link>
              {/* Messages and Video Chat buttons for business viewing talent profiles */}
              {connectionStatus === 'accepted' && connectionRequestId && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      // Navigate to dedicated messages page for this talent
                      router.push(`/dashboard/business/messages?talent_id=${viewTalentId}`)
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-semibold transition-colors"
                  >
                    Messages
                  </button>
                  <button
                    onClick={async () => {
                      setVideoChatLoading(true)
                      setVideoChatError(null)
                      try {
                        const { data: sessionRes } = await supabase.auth.getSession()
                        if (!sessionRes?.session?.user?.email) {
                          throw new Error('Please sign in to start video chat')
                        }
                        
                        const accessToken = sessionRes.session.access_token
                        
                        // Get business profile name
                        let businessName = 'Business'
                        try {
                          const { data: businessRes } = await supabase
                            .from('business_profiles')
                            .select('business_name, name')
                            .eq('user_id', sessionRes.session.user.id)
                            .maybeSingle()
                          
                          if (!businessRes.error && businessRes.data) {
                            businessName = businessRes.data.business_name || businessRes.data.name || 'Business'
                          }
                        } catch (err) {
                          console.error('[View Portfolio] Error loading business name:', err)
                        }
                        
                        // Initiate video chat
                        const response = await fetch('/api/video-chat/initiate', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                          },
                          body: JSON.stringify({
                            connection_request_id: connectionRequestId,
                            initiated_by: 'business',
                            recording_enabled: true,
                          }),
                        })
                        
                        if (!response.ok) {
                          const errorText = await response.text()
                          throw new Error(errorText || `HTTP error! status: ${response.status}`)
                        }
                        
                        const data = await response.json()
                        
                        if (!data.success) {
                          throw new Error(data.error || 'Failed to initiate video chat')
                        }
                        
                        if (data.session) {
                          setVideoChatSession({
                            ...data.session,
                            talentId: viewTalentId,
                            talentName: talentName || 'Talent',
                            businessName: businessName,
                          })
                        } else {
                          throw new Error('Invalid response from server')
                        }
                      } catch (err: any) {
                        console.error('[View Portfolio] Video chat error:', err)
                        setVideoChatError(err.message || 'Failed to start video chat')
                        alert(err.message || 'Failed to start video chat')
                      } finally {
                        setVideoChatLoading(false)
                      }
                    }}
                    disabled={videoChatLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-60"
                  >
                    {videoChatLoading ? 'Starting...' : 'Video Chat'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link href="/dashboard/talent" className="text-slate-300 hover:text-blue-400">
              ← Back to Dashboard
            </Link>
          )}
          {!viewTalentId && (
            <div className="flex items-center gap-3">
              <Link
                href="/portfolio"
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-semibold"
              >
                Edit Portfolio
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
            {error}
          </div>
        ) : !meta && isBusinessInitiated && talentSummary ? (
          // Show talent summary for business-initiated pending requests (like from Business Map)
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-4">Talent Summary</h1>
              
              {/* Talent Title/Role */}
              {talentSummary.title && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white">{talentSummary.title}</h2>
                </div>
              )}
              
              {/* Experience */}
              {talentSummary.experience_years !== null && talentSummary.experience_years !== undefined && (
                <div className="mb-4">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">{talentSummary.experience_years}</span> {talentSummary.experience_years === 1 ? 'year' : 'years'} of experience
                  </p>
                </div>
              )}
              
              {/* Location */}
              {(talentSummary.city || talentSummary.state || talentSummary.country) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-300">
                    📍 {[talentSummary.city, talentSummary.state, talentSummary.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {/* Search Summary (About) */}
              {talentSummary.search_summary && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">About</h4>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{talentSummary.search_summary}</p>
                </div>
              )}
              
              {/* Availability Description */}
              {talentSummary.availability_description && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Availability</h4>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{talentSummary.availability_description}</p>
                </div>
              )}
              
              {/* Skills Preview */}
              {talentSummary.skills && Array.isArray(talentSummary.skills) && talentSummary.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {talentSummary.skills.slice(0, 8).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {talentSummary.skills.length > 8 && (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                        +{talentSummary.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Privacy Notice */}
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  ℹ️ This is a brief summary provided by the talent. The full portfolio will be available once the connection request is accepted.
                </p>
              </div>
              
              {/* Withdraw Request Button (only for business-initiated pending requests) */}
              {connectionStatus === 'pending' && isBusinessInitiated && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={async () => {
                      if (!confirm('Are you sure you want to withdraw this connection request? This action cannot be undone.')) {
                        return
                      }
                      try {
                        const { data: sessionRes } = await supabase.auth.getSession()
                        const uid = sessionRes.session?.user?.id
                        if (!uid) {
                          alert('Please sign in to withdraw connection requests.')
                          return
                        }
                        
                        const businessRes = await supabase
                          .from('business_profiles')
                          .select('id')
                          .eq('user_id', uid)
                          .single()
                        
                        if (businessRes.error || !businessRes.data) {
                          alert('Business profile not found.')
                          return
                        }
                        
                        const { error } = await supabase
                          .from('talent_connection_requests')
                          .delete()
                          .eq('id', requestId)
                          .eq('business_id', businessRes.data.id)
                        
                        if (error) {
                          console.error('Error withdrawing connection request:', error)
                          alert('Failed to withdraw connection request. Please try again.')
                        } else {
                          alert('Connection request withdrawn successfully.')
                          window.location.href = '/dashboard/business?tab=connections'
                        }
                      } catch (err) {
                        console.error('Error withdrawing connection request:', err)
                        alert('An error occurred. Please try again.')
                      }
                    }}
                    className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                  >
                    Withdraw Request
                  </button>
                  <Link
                    href="/dashboard/business?tab=connections"
                    className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold transition-colors text-center"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : !meta ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8">
            {viewTalentId ? (
              // Only show "Portfolio Not Available" if it's NOT a business-initiated request AND not an accepted connection
              !isBusinessInitiated && connectionStatus !== 'accepted' ? (
                <>
                  <h1 className="text-2xl font-bold">Talent Portfolio Not Available</h1>
                  <p className="text-slate-300 mt-2">
                    {connectionStatus === 'accepted' 
                      ? 'Loading portfolio...' 
                      : 'This talent hasn\'t created a portfolio yet.'}
                  </p>
                </>
              ) : connectionStatus === 'accepted' ? (
                <>
                  <h1 className="text-2xl font-bold">Loading Portfolio...</h1>
                  <p className="text-slate-300 mt-2">
                    Please wait while we load the talent's portfolio.
                  </p>
                </>
              ) : null
            ) : (
              <>
                <h1 className="text-2xl font-bold">No portfolio saved yet</h1>
                <p className="text-slate-300 mt-2">
                  Create your portfolio first, then come back here to review exactly what it looks like.
                </p>
                <div className="mt-6">
                  <Link href="/portfolio" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold">
                    Build your portfolio
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* For business-initiated pending requests with meta, show talent summary instead of full portfolio */}
            {viewTalentId && requestId && isBusinessInitiated && (connectionStatus === 'pending' || connectionStatus === null || connectionStatus === '') && talentSummary ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-4">Talent Summary</h1>
                  
                  {/* Talent Title/Role */}
                  {talentSummary.title && (
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-white">{talentSummary.title}</h2>
                    </div>
                  )}
                  
                  {/* Experience */}
                  {talentSummary.experience_years !== null && talentSummary.experience_years !== undefined && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-300">
                        <span className="font-medium">{talentSummary.experience_years}</span> {talentSummary.experience_years === 1 ? 'year' : 'years'} of experience
                      </p>
                    </div>
                  )}
                  
                  {/* Location */}
                  {(talentSummary.city || talentSummary.state || talentSummary.country) && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-300">
                        📍 {[talentSummary.city, talentSummary.state, talentSummary.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* Search Summary (About) */}
                  {talentSummary.search_summary && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">About</h4>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{talentSummary.search_summary}</p>
                    </div>
                  )}
                  
                  {/* Availability Description */}
                  {talentSummary.availability_description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Availability</h4>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{talentSummary.availability_description}</p>
                    </div>
                  )}
                  
                  {/* Skills Preview */}
                  {talentSummary.skills && Array.isArray(talentSummary.skills) && talentSummary.skills.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {talentSummary.skills.slice(0, 8).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {talentSummary.skills.length > 8 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                            +{talentSummary.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Privacy Notice */}
                  <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300">
                      ℹ️ This is a brief summary provided by the talent. The full portfolio will be available once the connection request is accepted.
                    </p>
                  </div>
                  
                  {/* Withdraw Request Button */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to withdraw this connection request? This action cannot be undone.')) {
                          return
                        }
                        try {
                          const { data: sessionRes } = await supabase.auth.getSession()
                          const uid = sessionRes.session?.user?.id
                          if (!uid) {
                            alert('Please sign in to withdraw connection requests.')
                            return
                          }
                          
                          const businessRes = await supabase
                            .from('business_profiles')
                            .select('id')
                            .eq('user_id', uid)
                            .single()
                          
                          if (businessRes.error || !businessRes.data) {
                            alert('Business profile not found.')
                            return
                          }
                          
                          const { error } = await supabase
                            .from('talent_connection_requests')
                            .delete()
                            .eq('id', requestId)
                            .eq('business_id', businessRes.data.id)
                          
                          if (error) {
                            console.error('Error withdrawing connection request:', error)
                            alert('Failed to withdraw connection request. Please try again.')
                          } else {
                            alert('Connection request withdrawn successfully.')
                            window.location.href = '/dashboard/business?tab=connections'
                          }
                        } catch (err) {
                          console.error('Error withdrawing connection request:', err)
                          alert('An error occurred. Please try again.')
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                    >
                      Withdraw Request
                    </button>
                    <Link
                      href="/dashboard/business?tab=connections"
                      className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold transition-colors text-center"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Connection request actions when viewing from business context - moved to top above banner */}
                {/* Only show Accept/Decline buttons if it's NOT a business-initiated request (talent-initiated) */}
                {viewTalentId && requestId && meta && !isBusinessInitiated && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {connectionStatus === 'accepted' ? 'Connection' : 'Connection Request'}
                      </h3>
                      <p className="text-gray-400">
                        {connectionStatus === 'accepted' 
                          ? 'This connection has been accepted. You can discontinue it at any time.'
                          : 'Review the talent\'s portfolio below. You can accept or decline this connection request.'}
                      </p>
                    </div>
                    {(connectionStatus === 'pending' || connectionStatus === null || connectionStatus === '') ? (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={async () => {
                            try {
                              const { data: sessionRes } = await supabase.auth.getSession()
                              const uid = sessionRes.session?.user?.id
                              if (!uid) {
                                alert('Please sign in to respond to connection requests.')
                                return
                              }
                              
                              const businessRes = await supabase
                                .from('business_profiles')
                                .select('id')
                                .eq('user_id', uid)
                                .single()
                              
                              if (businessRes.error || !businessRes.data) {
                                alert('Business profile not found.')
                                return
                              }
                              
                              const { error } = await supabase
                                .from('talent_connection_requests')
                                .update({ 
                                  status: 'accepted',
                                  responded_at: new Date().toISOString()
                                })
                                .eq('id', requestId)
                                .eq('business_id', businessRes.data.id)
                              
                              if (error) {
                                console.error('Error accepting connection:', error)
                                alert('Failed to accept connection request. Please try again.')
                              } else {
                                setConnectionStatus('accepted')
                                window.location.reload()
                              }
                            } catch (err) {
                              console.error('Error accepting connection:', err)
                              alert('An error occurred. Please try again.')
                            }
                          }}
                          className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors shadow-lg"
                        >
                          ACCEPT
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { data: sessionRes } = await supabase.auth.getSession()
                              const uid = sessionRes.session?.user?.id
                              if (!uid) {
                                alert('Please sign in to respond to connection requests.')
                                return
                              }
                              
                              const businessRes = await supabase
                                .from('business_profiles')
                                .select('id')
                                .eq('user_id', uid)
                                .single()
                              
                              if (businessRes.error || !businessRes.data) {
                                alert('Business profile not found.')
                                return
                              }
                              
                              const { error } = await supabase
                                .from('talent_connection_requests')
                                .update({ 
                                  status: 'declined',
                                  responded_at: new Date().toISOString()
                                })
                                .eq('id', requestId)
                                .eq('business_id', businessRes.data.id)
                              
                              if (error) {
                                console.error('Error declining connection:', error)
                                alert('Failed to decline connection request. Please try again.')
                              } else {
                                window.location.href = '/dashboard/business?tab=connections'
                              }
                            } catch (err) {
                              console.error('Error declining connection:', err)
                              alert('An error occurred. Please try again.')
                            }
                          }}
                          className="px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-lg"
                        >
                          DECLINE
                        </button>
                      </div>
                    ) : connectionStatus === 'accepted' ? (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to discontinue this connection? This action cannot be undone.')) {
                              return
                            }
                            try {
                              const { data: sessionRes } = await supabase.auth.getSession()
                              const uid = sessionRes.session?.user?.id
                              if (!uid) {
                                alert('Please sign in to discontinue connections.')
                                return
                              }
                              
                              const businessRes = await supabase
                                .from('business_profiles')
                                .select('id')
                                .eq('user_id', uid)
                                .single()
                              
                              if (businessRes.error || !businessRes.data) {
                                alert('Business profile not found.')
                                return
                              }
                              
                              const { error } = await supabase
                                .from('talent_connection_requests')
                                .update({ 
                                  status: 'discontinued',
                                  responded_at: new Date().toISOString()
                                })
                                .eq('id', requestId)
                                .eq('business_id', businessRes.data.id)
                              
                              if (error) {
                                console.error('Error discontinuing connection:', error)
                                alert('Failed to discontinue connection. Please try again.')
                              } else {
                                alert('Connection discontinued successfully.')
                                window.location.href = '/dashboard/business?tab=connections'
                              }
                            } catch (err) {
                              console.error('Error discontinuing connection:', err)
                              alert('An error occurred. Please try again.')
                            }
                          }}
                          className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors"
                        >
                          Discontinue Connection
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
                {/* Hero */}
                <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
              <div className="h-44 md:h-64 bg-slate-900 relative">
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
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-3xl">
                          {name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="text-3xl md:text-4xl font-bold truncate">{name}</h1>
                        <p className="text-slate-300 mt-1">{title}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300 mt-3">
                          {location ? <span>📍 {location}</span> : null}
                          {yearsExperience ? (
                            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10">{yearsExperience}</span>
                          ) : null}
                        </div>
                      </div>
                      {!viewTalentId && (
                        <Link
                          href="/portfolio"
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold shrink-0"
                        >
                          Edit Portfolio
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Main */}
              <div className="lg:col-span-8 space-y-6">
                {/* About */}
                <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <h2 className="text-xl font-semibold mb-4">About</h2>
                  {bio ? (
                    <>
                      <p
                        className="text-slate-300 leading-relaxed whitespace-pre-wrap"
                        style={bioExpanded ? undefined : clampStyle(5)}
                      >
                        {bio}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setBioExpanded((v) => !v)}
                      >
                        {bioExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </>
                  ) : (
                    <div className="text-slate-400">No bio added yet.</div>
                  )}
                </section>

                {/* Intro video (below About, like your reference) */}
                {/* Show intro video section if introVideoId exists in saved portfolio, even if URL loading failed */}
                {(() => {
                  const hasIntroVideoId = typeof meta?.introVideoId === 'number' && meta.introVideoId !== null
                  if (!hasIntroVideoId) return null
                  
                  return (
                    <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                      <h2 className="text-xl font-semibold mb-4">{introVideoTitle || 'Introduction Video'}</h2>
                      {introVideoUrl ? (
                        <div className="mx-auto max-w-3xl">
                          {/* Soft frame */}
                          <div className="rounded-3xl p-[1px] bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                            <div className="rounded-3xl overflow-hidden bg-slate-950/60 border border-white/10">
                              <div className="bg-black">
                                <video
                                  src={introVideoUrl}
                                  controls
                                  playsInline
                                  className="w-full max-h-[280px] md:max-h-[300px] object-contain"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-400">
                            Tip: Keep your intro under 60–90 seconds and speak to your strongest work examples.
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400">
                          Introduction video is being loaded. If it doesn't appear, please check your video file in Edit Portfolio.
                        </div>
                      )}
                    </section>
                  )
                })()}

                {sectionOrder.map((k) => {
                  // Intro is handled above (defensive skip).
                  if (k === 'intro') return null
                  // Projects is intentionally rendered in the right column (under "Connect With Me") for layout aesthetics.
                  if (k === 'projects') return null
                  // Personal Documents is intentionally rendered in the right column (under Projects) for layout aesthetics.
                  if (k === 'personal_documents') return null
                  // Licences and Accreditations is intentionally rendered in the right column (under Personal Documents) for layout aesthetics.
                  if (k === 'licences_accreditations') return null
                  // Social links are intentionally rendered in the "Connect With Me" section in the sidebar.
                  if (k === 'social') return null
                  // Skills are intentionally rendered in the "Connect With Me" section in the sidebar.
                  if (k === 'skills') return null

                  if (k === 'experience') {
                    const expList = expListExpanded ? experience : experience.slice(0, 2)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Experience</h2>
                        {experience.length ? (
                          <div className="space-y-3">
                            {expList.map((e, idx) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{e?.role || e?.title || 'Role'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(e?.company || e?.organisation || 'Company') +
                                    (e?.startDate || e?.endDate ? ` • ${e?.startDate || ''} – ${e?.endDate || ''}` : '')}
                                </div>
                                {normalizeDisplayText(String(e?.description || '')) ? (
                                  <div className="mt-3">
                                    <div
                                      className="text-slate-300 whitespace-pre-wrap text-sm"
                                      style={expExpanded[idx] ? undefined : clampStyle(5)}
                                    >
                                      {normalizeDisplayText(String(e.description))}
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
                                
                                {(() => {
                                  // Render attachments for experience entries
                                  const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
                                    const num = typeof id === 'number' ? id : Number(id)
                                    return Number.isFinite(num) && num > 0
                                  }) : []
                                  
                                  if (attachmentIds.length === 0) return null
                                  
                                  return (
                                    <div className="mt-4">
                                      <div className="text-xs text-slate-400 mb-2">
                                        Attached documents:{' '}
                                        <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {attachmentIds.slice(0, 3).map((id: any) => {
                                          const numId = typeof id === 'number' ? id : Number(id)
                                          if (!Number.isFinite(numId) || numId <= 0) return null
                                          const it = tbItemCache[numId]
                                          if (!it) {
                                            return (
                                              <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                                Loading document {numId}…
                                              </div>
                                            )
                                          }
                                          const open = () => {
                                            const path = String(it?.file_path ?? '')
                                            if (path) {
                                              openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                              return
                                            }
                                          }
                                          return (
                                            <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                              {tbThumb(it)}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Document')}</div>
                                                <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                              </div>
                                              <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                                Open
                                              </button>
                                            </div>
                                          )
                                        })}
                                        {attachmentIds.length > 3 ? (
                                          <div className="text-xs text-slate-400 px-1">+{attachmentIds.length - 3} more…</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No experience added yet.</div>
                        )}
                        {experience.length > 2 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setExpListExpanded((v) => !v)}
                          >
                            {expListExpanded ? 'Show fewer roles' : 'Show all roles'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  if (k === 'education') {
                    const eduList = eduListExpanded ? education : education.slice(0, 2)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Education</h2>
                        {education.length ? (
                          <div className="space-y-3">
                            {eduList.map((e, idx) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{e?.qualification || e?.degree || 'Qualification'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(e?.institution || e?.school || 'Institution') +
                                    (e?.year || e?.endYear ? ` • ${e?.year || e?.endYear}` : '')}
                                </div>
                                {normalizeDisplayText(String(e?.notes || '')) ? (
                                  <div className="mt-3">
                                    <div
                                      className="text-slate-300 whitespace-pre-wrap text-sm"
                                      style={eduExpanded[idx] ? undefined : clampStyle(5)}
                                    >
                                      {normalizeDisplayText(String(e.notes))}
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

                                {(() => {
                                  // e comes from the processed education array (from useMemo), so attachmentIds should already be an array of numbers
                                  const attachmentIds = Array.isArray(e?.attachmentIds) ? e.attachmentIds.filter((id: any) => {
                                    const num = typeof id === 'number' ? id : Number(id)
                                    return Number.isFinite(num) && num > 0
                                  }) : []
                                  
                                  // Debug: Log attachment data for rendering
                                  if (attachmentIds.length > 0) {
                                    console.log(`[View Portfolio] Rendering education entry ${idx} with ${attachmentIds.length} attachments:`, {
                                      entryIndex: idx,
                                      institution: e?.institution || e?.school,
                                      degree: e?.degree || e?.qualification,
                                      processedAttachmentIds: attachmentIds,
                                      cacheSize: Object.keys(tbItemCache).length,
                                      cacheStatus: attachmentIds.map((id) => ({ id, cached: !!tbItemCache[id], item: tbItemCache[id] ? 'found' : 'missing' })),
                                    })
                                  } else if (idx === 0) {
                                    // Log first entry even without attachments to verify structure
                                    console.log(`[View Portfolio] Education entry ${idx} (no attachments):`, {
                                      entryIndex: idx,
                                      hasAttachmentIdsKey: 'attachmentIds' in e,
                                      attachmentIdsValue: e?.attachmentIds,
                                      attachmentIdsType: typeof e?.attachmentIds,
                                    })
                                  }
                                  
                                  if (attachmentIds.length === 0) return null
                                  
                                  return (
                                    <div className="mt-4">
                                      <div className="text-xs text-slate-400 mb-2">
                                        Attached documents:{' '}
                                        <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {attachmentIds.slice(0, 3).map((id: any) => {
                                          const numId = typeof id === 'number' ? id : Number(id)
                                          if (!Number.isFinite(numId) || numId <= 0) return null
                                          const it = tbItemCache[numId]
                                          if (!it) {
                                            // Item not in cache yet - trigger load and show loading state
                                            // The loadAttachments useEffect should pick this up
                                            return (
                                              <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                                Loading document {numId}…
                                              </div>
                                            )
                                          }
                                          const open = () => {
                                            const path = String(it?.file_path ?? '')
                                            if (path) {
                                              openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                              return
                                            }
                                          }
                                          return (
                                            <div key={numId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                              {tbThumb(it)}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Document')}</div>
                                                <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                              </div>
                                              <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                                Open
                                              </button>
                                            </div>
                                          )
                                        })}
                                        {attachmentIds.length > 3 ? (
                                          <div className="text-xs text-slate-400 px-1">+{attachmentIds.length - 3} more…</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No education added yet.</div>
                        )}
                        {education.length > 2 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setEduListExpanded((v) => !v)}
                          >
                            {eduListExpanded ? 'Show fewer entries' : 'Show all education'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  if (k === 'referees') {
                    const refList = refListExpanded ? referees : referees.slice(0, 2)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Referees</h2>
                        {referees.length ? (
                          <div className="space-y-3">
                            {refList.map((r, idx) => (
                              <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="font-semibold">{r?.name || 'Referee'}</div>
                                <div className="text-slate-300 text-sm mt-1">
                                  {(r?.title ? `${r.title} • ` : '') +
                                    (r?.company ? `${r.company} • ` : '') +
                                    (r?.relationship ? r.relationship : '')}
                                </div>
                                {(r?.email || r?.phone) && (
                                  <div className="text-slate-400 text-sm mt-2">
                                    {r?.email ? <div>Email: {r.email}</div> : null}
                                    {r?.phone ? <div>Phone: {r.phone}</div> : null}
                                  </div>
                                )}
                                {normalizeDisplayText(String(r?.notes || '')) ? (
                                  <div className="mt-3">
                                    <div
                                      className="text-slate-300 whitespace-pre-wrap text-sm"
                                      style={refExpanded[idx] ? undefined : clampStyle(5)}
                                    >
                                      {normalizeDisplayText(String(r.notes))}
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

                                {(() => {
                                  // Ensure we check attachmentIds from the mapped referee object
                                  const attachmentIds = Array.isArray(r?.attachmentIds) ? r.attachmentIds : []
                                  if (attachmentIds.length === 0) return null
                                  
                                  return (
                                    <div className="mt-4">
                                      <div className="text-xs text-slate-400 mb-2">
                                        Attached documents:{' '}
                                        <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {attachmentIds.slice(0, 3).map((id: any) => {
                                          const numId = Number(id)
                                          if (!Number.isFinite(numId) || numId <= 0) return null
                                          const it = tbItemCache[numId]
                                          if (!it) {
                                            return (
                                              <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                                Loading…
                                              </div>
                                            )
                                          }
                                          const open = () => {
                                            const path = String(it?.file_path ?? '')
                                            if (path) {
                                              openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                              return
                                            }
                                          }
                                          return (
                                            <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                              {tbThumb(it)}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Document')}</div>
                                                <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                              </div>
                                              <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                                Open
                                              </button>
                                            </div>
                                          )
                                        })}
                                        {attachmentIds.length > 3 ? (
                                          <div className="text-xs text-slate-400 px-1">+{attachmentIds.length - 3} more…</div>
                                        ) : null}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No referees added yet.</div>
                        )}
                        {referees.length > 2 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setRefListExpanded((v) => !v)}
                          >
                            {refListExpanded ? 'Show fewer referees' : 'Show all referees'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }



                  if (k === 'attachments') {
                    const aList = attachExpanded ? attachments : attachments.slice(0, 6)
                    return (
                      <section key={k} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                        <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                        {attachments.length ? (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {aList.map((a, idx) => (
                              <div
                                key={`${a?.id ?? idx}`}
                                className="rounded-xl border border-white/10 bg-slate-900/40 p-3 hover:bg-slate-900/60 transition-colors"
                              >
                                <AttachmentThumb a={a} />
                                <div className="mt-3">
                                  <div className="text-sm text-slate-200 truncate">{a?.title || 'Attachment'}</div>
                                  <div className="text-xs text-slate-500 mt-1">{a?.file_type || a?.item_type || 'File'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400">No attachments selected yet.</div>
                        )}
                        {attachments.length > 6 ? (
                          <button
                            type="button"
                            className="mt-4 text-blue-300 hover:text-blue-200 text-sm font-medium"
                            onClick={() => setAttachExpanded((v) => !v)}
                          >
                            {attachExpanded ? 'Show fewer attachments' : 'Show all attachments'}
                          </button>
                        ) : null}
                      </section>
                    )
                  }

                  // Unknown/unsupported section keys: skip silently (defensive).
                  return null
                })}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="text-slate-200 font-semibold mb-4">Connect With Me</div>
                  <div className="space-y-4 text-sm">
                    {authEmail ? (
                      <div>
                        <div className="text-slate-400 text-xs">Email</div>
                        <div className="text-slate-200 break-all">{authEmail}</div>
                      </div>
                    ) : null}
                    {(meta as any)?.phone ? (
                      <div>
                        <div className="text-slate-400 text-xs">Phone</div>
                        <div className="text-slate-200">{String((meta as any).phone)}</div>
                      </div>
                    ) : null}
                    {(() => {
                      // Keep legacy LinkedIn field support, but avoid duplicating if socialLinks already includes LinkedIn.
                      if (socialLinks.some((s) => String(s.platform).toLowerCase().includes('linkedin'))) return null
                      const m: any = meta ?? {}
                      const link =
                        m.linkedin ||
                        m.linkedIn ||
                        m?.social?.linkedin ||
                        m?.socialLinks?.linkedin ||
                        m?.socials?.linkedin ||
                        null
                      if (!link) return null
                      return (
                        <div>
                          <div className="text-slate-400 text-xs">LinkedIn</div>
                          <a className="text-blue-300 hover:text-blue-200 break-all" href={String(link)} target="_blank" rel="noreferrer">
                            {String(link)}
                          </a>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Social icons under Connect with Me */}
                  {socialLinks.length ? (
                    <div className="mt-6">
                      <div className="text-slate-400 text-xs mb-2">Social</div>
                      <SocialIconBar links={socialLinks} />
                    </div>
                  ) : null}

                  {skills.length ? (
                    <div className="mt-6">
                      <div className="text-slate-400 text-xs mb-2">Top skills</div>
                      <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 6).map((s, idx) => (
                          <span key={`${s}-${idx}`} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Family and Community: placed under Connect With Me and above Projects */}
                {familyCommunityImageIds.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                    <div className="text-slate-200 font-semibold mb-4">Family and Community</div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setFamilyCommunityGalleryOpen(true)}
                        className="rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden hover:border-blue-400 transition-all cursor-pointer"
                        style={{ width: '377px', height: '377px', maxWidth: '100%' }}
                        title="Click to view Family and Community gallery"
                      >
                      {(() => {
                        // Get the first image as a preview/thumbnail
                        const firstImageId = familyCommunityImageIds[0]
                        const firstItem = tbItemCache[firstImageId]
                        if (!firstItem) {
                          return (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                              <div className="text-slate-400 text-sm">Loading...</div>
                            </div>
                          )
                        }
                        const path = String(firstItem?.file_path ?? '')
                        const url = path ? thumbUrls[path] : null
                        if (path && !url) ensureSignedUrl(path).catch(() => {})

                        if (url) {
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt="Family and Community"
                              className="w-full h-full object-cover"
                            />
                          )
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                            <div className="text-slate-400 text-sm">Family and Community</div>
                          </div>
                        )
                      })()}
                    </button>
                    </div>
                  </div>
                )}

                {/* Projects: placed under Connect With Me to sit beside the intro video */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-slate-200 font-semibold">Projects</div>
                    {projects.length > 2 ? (
                      <button
                        type="button"
                        className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setProjListExpanded((v) => !v)}
                      >
                        {projListExpanded ? 'Show less' : 'Show all'}
                      </button>
                    ) : null}
                  </div>

                  {projects.length ? (
                    <div className="space-y-3">
                      {(projListExpanded ? projects : projects.slice(0, 2)).map((p, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                          <div className="font-semibold">{p?.name || 'Project'}</div>
                          {p?.url ? (
                            <a className="text-blue-300 hover:text-blue-200 text-sm mt-1 inline-block break-all" href={p.url} target="_blank" rel="noreferrer">
                              {p.url}
                            </a>
                          ) : null}
                          {normalizeDisplayText(String(p?.description || '')) ? (
                            <div className="mt-3">
                              <div className="text-slate-300 whitespace-pre-wrap text-sm" style={projExpanded[idx] ? undefined : clampStyle(5)}>
                                {normalizeDisplayText(String(p.description))}
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
                                Attached items:{' '}
                                <span className="text-slate-200 font-semibold">{(p as any).attachmentIds.length}</span>
                              </div>
                              <div className="space-y-2">
                                {(p as any).attachmentIds.slice(0, 3).map((id: any) => {
                                  const it = tbItemCache[Number(id)]
                                  if (!it) {
                                    return (
                                      <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-400">
                                        Loading…
                                      </div>
                                    )
                                  }
                                  const open = () => {
                                    const path = String(it?.file_path ?? '')
                                    if (path) {
                                      openPath(path, it?.file_type ?? null, String(it?.title || 'Item'))
                                      return
                                    }
                                    if (String(it?.item_type).toLowerCase() === 'social') {
                                      const u = String((it?.metadata as any)?.url ?? '').trim()
                                      if (u) window.open(/^https?:\/\//i.test(u) ? u : `https://${u}`, '_blank')
                                    }
                                  }
                                  return (
                                    <div key={id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3">
                                      {tbThumb(it)}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm text-slate-200 truncate">{String(it?.title || 'Item')}</div>
                                        <div className="text-xs text-slate-400 truncate">{String(it?.item_type || '')}</div>
                                      </div>
                                      <button type="button" className="text-xs text-blue-300 underline" onClick={open}>
                                        Open
                                      </button>
                                    </div>
                                  )
                                })}
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
                    <div className="text-slate-400 text-sm">No projects added yet.</div>
                  )}
                </div>

                {/* Personal Documents: placed under Projects in the right column */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-slate-200 font-semibold">Personal Documents</div>
                    {personalDocuments.length > 2 ? (
                      <button
                        type="button"
                        className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setPersonalDocListExpanded((v) => !v)}
                      >
                        {personalDocListExpanded ? 'Show less' : 'Show all'}
                      </button>
                    ) : null}
                  </div>

                  {personalDocuments.length ? (
                    <div className="space-y-3">
                      {(personalDocListExpanded ? personalDocuments : personalDocuments.slice(0, 2)).map((doc, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                          <div className="font-semibold text-slate-200">{doc.title || `Document ${idx + 1}`}</div>
                          {doc.description ? (
                            <div className="mt-2">
                              <div className="text-slate-300 whitespace-pre-wrap text-sm" style={personalDocExpanded[idx] ? undefined : clampStyle(5)}>
                                {doc.description}
                              </div>
                              {doc.description.split('\n').length > 5 ? (
                                <button
                                  type="button"
                                  className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                  onClick={() => setPersonalDocExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                >
                                  {personalDocExpanded[idx] ? 'Show less' : 'Show more'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          {(() => {
                            const attachmentIds = Array.isArray(doc.attachmentIds) ? doc.attachmentIds : []
                            if (attachmentIds.length === 0) return null
                            
                            return (
                              <div className="mt-3">
                                <div className="text-xs text-slate-400 mb-2">
                                  Attached files:{' '}
                                  <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {attachmentIds.slice(0, 4).map((id: any) => {
                                    const numId = typeof id === 'number' ? id : Number(id)
                                    if (!Number.isFinite(numId) || numId <= 0) return null
                                    const it = tbItemCache[numId]
                                    if (!it) {
                                      return (
                                        <div key={numId} className="w-[15mm] h-[15mm] rounded-lg border border-white/10 bg-slate-950/40 flex items-center justify-center">
                                          <div className="text-xs text-slate-400">…</div>
                                        </div>
                                      )
                                    }
                                    const path = String(it?.file_path ?? '')
                                    const open = () => {
                                      if (path) {
                                        openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                        return
                                      }
                                      if (it?.file_url) {
                                        window.open(it.file_url, '_blank')
                                        return
                                      }
                                    }
                                    const isImg = it.file_type?.startsWith('image') || it.item_type === 'image'
                                    const isVid = it.file_type?.startsWith('video') || it.item_type === 'video'
                                    const ext = path ? path.split('.').pop()?.toUpperCase().slice(0, 4) : null
                                    const label = isImg ? 'IMG' : isVid ? 'VID' : ext || 'FILE'
                                    if (path && (isImg || isVid) && !thumbUrls[path]) ensureSignedUrl(path).catch(() => {})
                                    const url = path ? thumbUrls[path] : null
                                    return (
                                      <button
                                        key={numId}
                                        type="button"
                                        onClick={open}
                                        className="w-[15mm] h-[15mm] rounded-lg border border-white/10 bg-slate-900/30 overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors"
                                        title={String(it?.title || 'Document')}
                                      >
                                        {url && isImg ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={url} alt={String(it?.title || 'Document')} className="w-full h-full object-cover" />
                                        ) : url && isVid ? (
                                          <div className="relative w-full h-full">
                                            <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold bg-black/30 text-white">
                                              ▶
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs font-semibold text-slate-400">{label}</div>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                                {attachmentIds.length > 4 ? (
                                  <div className="text-xs text-slate-400 mt-2 px-1">+{attachmentIds.length - 4} more…</div>
                                ) : null}
                              </div>
                            )
                          })()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">No personal documents added yet.</div>
                  )}
                </div>

                {/* Licences and Accreditations: placed under Personal Documents in the right column */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-slate-200 font-semibold">Licences and Accreditations</div>
                    {licencesAccreditations.length > 2 ? (
                      <button
                        type="button"
                        className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                        onClick={() => setLicenceListExpanded((v) => !v)}
                      >
                        {licenceListExpanded ? 'Show less' : 'Show all'}
                      </button>
                    ) : null}
                  </div>

                  {licencesAccreditations.length ? (
                    <div className="space-y-3">
                      {(licenceListExpanded ? licencesAccreditations : licencesAccreditations.slice(0, 2)).map((lic, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                          <div className="font-semibold text-slate-200">{lic.title || `Licence/Accreditation ${idx + 1}`}</div>
                          {(lic.issuer || lic.issueDate || lic.expiryDate) && (
                            <div className="text-slate-300 text-sm mt-1">
                              {lic.issuer ? `${lic.issuer} • ` : ''}
                              {lic.issueDate ? `Issued: ${lic.issueDate} • ` : ''}
                              {lic.expiryDate ? `Expires: ${lic.expiryDate}` : ''}
                            </div>
                          )}
                          {lic.description ? (
                            <div className="mt-2">
                              <div className="text-slate-300 whitespace-pre-wrap text-sm" style={licenceExpanded[idx] ? undefined : clampStyle(5)}>
                                {lic.description}
                              </div>
                              {lic.description.split('\n').length > 5 ? (
                                <button
                                  type="button"
                                  className="mt-2 text-blue-300 hover:text-blue-200 text-sm font-medium"
                                  onClick={() => setLicenceExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                                >
                                  {licenceExpanded[idx] ? 'Show less' : 'Show more'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                          {(() => {
                            const attachmentIds = Array.isArray(lic.attachmentIds) ? lic.attachmentIds : []
                            if (attachmentIds.length === 0) return null
                            
                            return (
                              <div className="mt-3">
                                <div className="text-xs text-slate-400 mb-2">
                                  Attached files:{' '}
                                  <span className="text-slate-200 font-semibold">{attachmentIds.length}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {attachmentIds.slice(0, 4).map((id: any) => {
                                    const numId = typeof id === 'number' ? id : Number(id)
                                    if (!Number.isFinite(numId) || numId <= 0) return null
                                    const it = tbItemCache[numId]
                                    if (!it) {
                                      return (
                                        <div key={numId} className="w-[15mm] h-[15mm] rounded-lg border border-white/10 bg-slate-950/40 flex items-center justify-center">
                                          <div className="text-xs text-slate-400">…</div>
                                        </div>
                                      )
                                    }
                                    const path = String(it?.file_path ?? '')
                                    const open = () => {
                                      if (path) {
                                        openPath(path, it?.file_type ?? null, String(it?.title || 'Document'))
                                        return
                                      }
                                      if (it?.file_url) {
                                        window.open(it.file_url, '_blank')
                                        return
                                      }
                                    }
                                    const isImg = it.file_type?.startsWith('image') || it.item_type === 'image'
                                    const isVid = it.file_type?.startsWith('video') || it.item_type === 'video'
                                    const ext = path ? path.split('.').pop()?.toUpperCase().slice(0, 4) : null
                                    const label = isImg ? 'IMG' : isVid ? 'VID' : ext || 'FILE'
                                    if (path && (isImg || isVid) && !thumbUrls[path]) ensureSignedUrl(path).catch(() => {})
                                    const url = path ? thumbUrls[path] : null
                                    return (
                                      <button
                                        key={numId}
                                        type="button"
                                        onClick={open}
                                        className="w-[15mm] h-[15mm] rounded-lg border border-white/10 bg-slate-900/30 overflow-hidden flex items-center justify-center hover:border-blue-400 transition-colors"
                                        title={String(it?.title || 'Document')}
                                      >
                                        {url && isImg ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={url} alt={String(it?.title || 'Document')} className="w-full h-full object-cover" />
                                        ) : url && isVid ? (
                                          <div className="relative w-full h-full">
                                            <video className="w-full h-full object-cover" src={url} muted playsInline preload="metadata" />
                                            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold bg-black/30 text-white">
                                              ▶
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs font-semibold text-slate-400">{label}</div>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>
                                {attachmentIds.length > 4 ? (
                                  <div className="text-xs text-slate-400 mt-2 px-1">+{attachmentIds.length - 4} more…</div>
                                ) : null}
                              </div>
                            )
                          })()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">No licences or accreditations added yet.</div>
                  )}
                </div>

              </aside>
            </div>
            </>
            )}
          </div>
        )}
      </main>
      
      {/* Video Chat Modal */}
      {videoChatSession && (
        <VideoChat
          session={videoChatSession}
          onClose={() => {
            setVideoChatSession(null)
            setVideoChatError(null)
          }}
        />
      )}
      
      {/* Video Chat Error Display */}
      {videoChatError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <p className="font-semibold">Video Chat Error</p>
          <p className="text-sm">{videoChatError}</p>
          <button
            onClick={() => setVideoChatError(null)}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}


