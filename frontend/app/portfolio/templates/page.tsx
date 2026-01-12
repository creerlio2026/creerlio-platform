'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TemplateSelector from '@/components/TemplateSelector'
import { supabase } from '@/lib/supabase'
import { PortfolioData } from '@/types/portfolio'

export default function PortfolioTemplatesPage() {
  const router = useRouter()
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPortfolioData()
  }, [])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        router.push('/login/talent')
        return
      }

      // Default placeholder portfolio data
      const defaultPortfolio: PortfolioData = {
        name: session.user.user_metadata?.full_name || 'Your Name',
        title: 'Your Professional Title',
        bio: 'Your professional bio will appear here. Tell businesses about your experience, skills, and what makes you unique.',
        avatar_path: null,
        banner_path: null,
        socialLinks: [],
        skills: ['Sample Skill 1', 'Sample Skill 2', 'Sample Skill 3'],
        experience: [{
          company: 'Sample Company',
          title: 'Your Role',
          startDate: '2020',
          endDate: 'Present',
          description: 'Your work experience will be displayed here.'
        }],
        education: [{
          institution: 'Your School',
          degree: 'Your Degree',
          field: 'Your Field',
          year: '2020'
        }],
        referees: [],
        attachments: [],
        projects: [{
          name: 'Sample Project',
          description: 'Your projects will be showcased here.',
          url: ''
        }],
      }

      // Load portfolio data from talent_bank_items (NOT talent_profiles)
      const { data: portfolioItems, error: portfolioError } = await supabase
        .from('talent_bank_items')
        .select('id, metadata, created_at')
        .eq('user_id', session.user.id)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)

      if (portfolioError || !portfolioItems || portfolioItems.length === 0) {
        // Use default data if portfolio doesn't exist yet
        console.log('No portfolio found in talent_bank, using placeholder data')
        setPortfolioData(defaultPortfolio)
        setSelectedSections(['intro', 'skills', 'experience', 'education', 'projects', 'social'])
        setCurrentTemplateId(1)
        setLoading(false)
        return
      }

      // Extract portfolio metadata
      const portfolioMeta = portfolioItems[0]?.metadata || {}

      // Transform data into PortfolioData format
      const portfolio: PortfolioData = {
        name: portfolioMeta.name || session.user.user_metadata?.full_name || defaultPortfolio.name,
        title: portfolioMeta.title || defaultPortfolio.title,
        bio: portfolioMeta.bio || defaultPortfolio.bio,
        avatar_path: portfolioMeta.avatar_path || null,
        banner_path: portfolioMeta.banner_path || null,
        socialLinks: Array.isArray(portfolioMeta.socialLinks) ? portfolioMeta.socialLinks : [],
        skills: Array.isArray(portfolioMeta.skills) && portfolioMeta.skills.length > 0 ? portfolioMeta.skills : defaultPortfolio.skills,
        experience: Array.isArray(portfolioMeta.experience) && portfolioMeta.experience.length > 0 ? portfolioMeta.experience : defaultPortfolio.experience,
        education: Array.isArray(portfolioMeta.education) && portfolioMeta.education.length > 0 ? portfolioMeta.education : defaultPortfolio.education,
        referees: Array.isArray(portfolioMeta.referees) ? portfolioMeta.referees : [],
        attachments: Array.isArray(portfolioMeta.attachments) ? portfolioMeta.attachments : [],
        projects: Array.isArray(portfolioMeta.projects) && portfolioMeta.projects.length > 0 ? portfolioMeta.projects : defaultPortfolio.projects,
      }

      setPortfolioData(portfolio)

      // Load template preference from portfolio metadata (NOT talent_profiles)
      setCurrentTemplateId(portfolioMeta.selected_template_id || null)

      // Load visible sections from portfolio metadata
      setSelectedSections(portfolioMeta.visible_sections || ['intro', 'skills', 'experience', 'education', 'projects', 'social'])

    } catch (error) {
      console.error('Error loading portfolio:', error)
      // Even on error, set default data so templates are accessible
      const defaultPortfolio: PortfolioData = {
        name: 'Your Name',
        title: 'Your Professional Title',
        bio: 'Your professional bio will appear here.',
        avatar_path: null,
        banner_path: null,
        socialLinks: [],
        skills: ['Sample Skill 1', 'Sample Skill 2', 'Sample Skill 3'],
        experience: [{
          company: 'Sample Company',
          title: 'Your Role',
          startDate: '2020',
          endDate: 'Present',
          description: 'Your work experience will be displayed here.'
        }],
        education: [{
          institution: 'Your School',
          degree: 'Your Degree',
          field: 'Your Field',
          year: '2020'
        }],
        referees: [],
        attachments: [],
        projects: [{
          name: 'Sample Project',
          description: 'Your projects will be showcased here.',
          url: ''
        }],
      }
      setPortfolioData(defaultPortfolio)
      setSelectedSections(['intro', 'skills', 'experience', 'education', 'projects', 'social'])
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        router.push(`/portfolio/template/${templateId}`)
        return
      }

      // Load existing portfolio from talent_bank_items
      const { data: portfolioItems } = await supabase
        .from('talent_bank_items')
        .select('id, metadata')
        .eq('user_id', session.user.id)
        .eq('item_type', 'portfolio')
        .order('created_at', { ascending: false })
        .limit(1)

      const existingPortfolio = portfolioItems?.[0]
      if (existingPortfolio) {
        // Update portfolio metadata with selected template
        const updatedMetadata = {
          ...(existingPortfolio.metadata || {}),
          selected_template_id: templateId
        }

        // Save template selection to portfolio metadata
        await supabase
          .from('talent_bank_items')
          .update({ metadata: updatedMetadata })
          .eq('id', existingPortfolio.id)
          .eq('user_id', session.user.id)
      }

      // Navigate immediately to template page
      router.push(`/portfolio/template/${templateId}`)
    } catch (error) {
      console.error('Error saving template:', error)
      // Navigate even on error
      router.push(`/portfolio/template/${templateId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading templates...</p>
        </div>
      </div>
    )
  }

  // portfolioData will always be available (either real data or placeholder)
  // so users can access templates regardless of portfolio completion status
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Creerlio
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/portfolio"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                ← Portfolio Editor
              </Link>
              <Link
                href="/dashboard/talent"
                className="text-slate-300 hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Template Selector */}
      <main>
        {saving && (
          <div className="fixed top-20 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            Template saved! ✓
          </div>
        )}
        <TemplateSelector
          shareConfig={null}
          currentTemplateId={currentTemplateId}
          onSelect={handleTemplateSelect}
          onClose={() => router.push('/portfolio')}
        />
      </main>
    </div>
  )
}
