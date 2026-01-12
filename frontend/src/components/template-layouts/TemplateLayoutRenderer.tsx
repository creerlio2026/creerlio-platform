/**
 * Template Layout Renderer
 * 
 * Renders unique layouts for each template
 * Each template has its own distinct design, arrangement, and styling
 */

'use client'

import { TemplateId, PortfolioTemplate } from '../portfolioTemplates'
import { TemplateViewPortfolioData } from '../TemplateView'
import { TemplateState } from '../TemplateView'

// Import individual template layouts
import CreativeMinimalistLayout from './CreativeMinimalistLayout'
import PhotographerLayout from './PhotographerLayout'
import ContentWriterLayout from './ContentWriterLayout'
import VideoProducerLayout from './VideoProducerLayout'
import FullStackDeveloperLayout from './FullStackDeveloperLayout'
import DataScientistLayout from './DataScientistLayout'
import UXResearcherLayout from './UXResearcherLayout'
import MarketingManagerLayout from './MarketingManagerLayout'
import ProductManagerLayout from './ProductManagerLayout'
import ManagementConsultantLayout from './ManagementConsultantLayout'
import SalesProfessionalLayout from './SalesProfessionalLayout'
import HealthcareProfessionalLayout from './HealthcareProfessionalLayout'
import NurseClinicalLayout from './NurseClinicalLayout'
import ResearchScientistLayout from './ResearchScientistLayout'
import TeacherEducatorLayout from './TeacherEducatorLayout'
import ChefCulinaryLayout from './ChefCulinaryLayout'
import EventPlannerLayout from './EventPlannerLayout'
import FinancialAnalystLayout from './FinancialAnalystLayout'
import HRSpecialistLayout from './HRSpecialistLayout'
import ArchitectLayout from './ArchitectLayout'

interface TemplateLayoutRendererProps {
  template: PortfolioTemplate
  portfolioData: TemplateViewPortfolioData
  templateState: TemplateState
  editMode: boolean
  onToggleSection: (section: string) => void
  onToggleItem: (section: string, index: number) => void
  onToggleAvatar: () => void
  onToggleBanner: () => void
  onToggleIntroVideo: () => void
  onUpdateBio?: (bio: string) => void
  onUpdateFamilyCommunityDescription?: (imageId: number, description: string) => void
  avatarUrl: string | null
  bannerUrl: string | null
  introVideoUrl: string | null
  attachmentUrls: Record<number, string>
  attachmentItemUrls: Record<number, string>
  familyCommunityUrls: Record<number, string>
  tbItemCache: Record<number, any>
  expandedTextareas?: Record<string, boolean>
  onToggleTextarea?: (key: string) => void
}

export default function TemplateLayoutRenderer({
  template,
  portfolioData,
  templateState,
  editMode,
  onToggleSection,
  onToggleItem,
  onToggleAvatar,
  onToggleBanner,
  onToggleIntroVideo,
  onUpdateBio,
  onUpdateFamilyCommunityDescription,
  avatarUrl,
  bannerUrl,
  introVideoUrl,
  attachmentUrls,
  attachmentItemUrls,
  familyCommunityUrls,
  tbItemCache,
  expandedTextareas = {},
  onToggleTextarea,
}: TemplateLayoutRendererProps) {
  const commonProps = {
    portfolioData,
    templateState,
    editMode,
    onToggleSection,
    onToggleItem,
    onToggleAvatar,
    onToggleBanner,
    onToggleIntroVideo,
    onUpdateBio,
    onUpdateFamilyCommunityDescription,
    avatarUrl,
    bannerUrl,
    introVideoUrl,
    attachmentUrls,
    attachmentItemUrls,
    familyCommunityUrls,
    tbItemCache,
    expandedTextareas,
    onToggleTextarea,
  }

  // Render unique layout based on template_id
  switch (template.template_id) {
    case 'creative-minimalist':
      return <CreativeMinimalistLayout {...commonProps} />
    case 'photographer-portfolio':
      return <PhotographerLayout {...commonProps} />
    case 'content-writer':
      return <ContentWriterLayout {...commonProps} />
    case 'video-producer':
      return <VideoProducerLayout {...commonProps} />
    case 'fullstack-developer':
      return <FullStackDeveloperLayout {...commonProps} />
    case 'data-scientist':
      return <DataScientistLayout {...commonProps} />
    case 'ux-researcher':
      return <UXResearcherLayout {...commonProps} />
    case 'marketing-manager':
      return <MarketingManagerLayout {...commonProps} />
    case 'product-manager':
      return <ProductManagerLayout {...commonProps} />
    case 'management-consultant':
      return <ManagementConsultantLayout {...commonProps} />
    case 'sales-professional':
      return <SalesProfessionalLayout {...commonProps} />
    case 'healthcare-professional':
      return <HealthcareProfessionalLayout {...commonProps} />
    case 'nurse-clinical':
      return <NurseClinicalLayout {...commonProps} />
    case 'research-scientist':
      return <ResearchScientistLayout {...commonProps} />
    case 'teacher-educator':
      return <TeacherEducatorLayout {...commonProps} />
    case 'chef-culinary':
      return <ChefCulinaryLayout {...commonProps} />
    case 'event-planner':
      return <EventPlannerLayout {...commonProps} />
    case 'financial-analyst':
      return <FinancialAnalystLayout {...commonProps} />
    case 'hr-specialist':
      return <HRSpecialistLayout {...commonProps} />
    case 'architect':
      return <ArchitectLayout {...commonProps} />
    default:
      // Fallback to a default layout
      return <CreativeMinimalistLayout {...commonProps} />
  }
}
