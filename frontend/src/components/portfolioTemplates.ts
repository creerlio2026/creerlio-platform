/**
 * CANONICAL TALENT PORTFOLIO TEMPLATE REGISTRY
 * 
 * This is the SINGLE SOURCE OF TRUTH for all portfolio templates.
 * No templates may exist outside this file.
 * 
 * Total: 20 templates (exactly as specified)
 */

export type TemplateId = 
  // Creative (4)
  | 'creative-minimalist'
  | 'photographer-portfolio'
  | 'content-writer'
  | 'video-producer'
  // Technology (3)
  | 'fullstack-developer'
  | 'data-scientist'
  | 'ux-researcher'
  // Business (4)
  | 'marketing-manager'
  | 'product-manager'
  | 'management-consultant'
  | 'sales-professional'
  // Healthcare (2)
  | 'healthcare-professional'
  | 'nurse-clinical'
  // Science (1)
  | 'research-scientist'
  // Education (1)
  | 'teacher-educator'
  // Hospitality (2)
  | 'chef-culinary'
  | 'event-planner'
  // Additional (3)
  | 'financial-analyst'
  | 'hr-specialist'
  | 'architect'

export type TemplateCategory = 
  | 'Creative'
  | 'Technology'
  | 'Business'
  | 'Healthcare'
  | 'Education'
  | 'Hospitality'
  | 'Science'
  | 'Additional'

export type SupportedSection = 
  | 'intro'
  | 'social'
  | 'skills'
  | 'experience'
  | 'education'
  | 'referees'
  | 'projects'
  | 'attachments'
  | 'family_community'

export interface PortfolioTemplate {
  template_id: TemplateId
  name: string
  description: string
  category: TemplateCategory
  featured: boolean
  supported_sections: SupportedSection[]
  media_support: {
    avatar: boolean
    banner: boolean
    video: boolean
  }
  layout_component: string // For future component-based rendering
}

/**
 * CANONICAL TEMPLATE REGISTRY
 * Exactly 20 templates - no more, no less
 */
export const CANONICAL_PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  // 🎨 Creative (4)
  {
    template_id: 'creative-minimalist',
    name: 'Creative Minimalist',
    description: 'Clean, modern design perfect for designers and creatives',
    category: 'Creative',
    featured: true,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: true, video: true },
    layout_component: 'CreativeMinimalistLayout',
  },
  {
    template_id: 'photographer-portfolio',
    name: 'Photography Portfolio',
    description: 'Showcase your photography work with a clean, image-focused layout',
    category: 'Creative',
    featured: true,
    supported_sections: ['intro', 'social', 'experience', 'projects', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: true, video: false },
    layout_component: 'PhotographerLayout',
  },
  {
    template_id: 'content-writer',
    name: 'Content Writer',
    description: 'Writing-focused portfolio for content creators and copywriters',
    category: 'Creative',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'ContentWriterLayout',
  },
  {
    template_id: 'video-producer',
    name: 'Video Producer',
    description: 'Multimedia portfolio for video producers and filmmakers',
    category: 'Creative',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'projects', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: true, video: true },
    layout_component: 'VideoProducerLayout',
  },

  // 💻 Technology (3)
  {
    template_id: 'fullstack-developer',
    name: 'Full-Stack Developer',
    description: 'Technical portfolio highlighting coding skills and project experience',
    category: 'Technology',
    featured: true,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'FullStackDeveloperLayout',
  },
  {
    template_id: 'data-scientist',
    name: 'Data Scientist',
    description: 'Analytics-focused portfolio for data professionals',
    category: 'Technology',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'DataScientistLayout',
  },
  {
    template_id: 'ux-researcher',
    name: 'UX Researcher',
    description: 'User experience research portfolio with methodology focus',
    category: 'Technology',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'UXResearcherLayout',
  },

  // 🧠 Business (4)
  {
    template_id: 'marketing-manager',
    name: 'Marketing Manager',
    description: 'Results-driven portfolio for marketing professionals',
    category: 'Business',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'MarketingManagerLayout',
  },
  {
    template_id: 'product-manager',
    name: 'Product Manager',
    description: 'Product-focused portfolio highlighting strategy and execution',
    category: 'Business',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'ProductManagerLayout',
  },
  {
    template_id: 'management-consultant',
    name: 'Management Consultant',
    description: 'Consulting-focused portfolio for business advisors',
    category: 'Business',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'ManagementConsultantLayout',
  },
  {
    template_id: 'sales-professional',
    name: 'Sales Professional',
    description: 'Sales-focused portfolio highlighting achievements and techniques',
    category: 'Business',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'SalesProfessionalLayout',
  },

  // 🏥 Healthcare (2)
  {
    template_id: 'healthcare-professional',
    name: 'Healthcare Professional',
    description: 'Clinical and healthcare-focused portfolio template',
    category: 'Healthcare',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'education', 'referees', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'HealthcareProfessionalLayout',
  },
  {
    template_id: 'nurse-clinical',
    name: 'Nurse & Clinical Professional',
    description: 'Nursing and clinical care portfolio for healthcare workers',
    category: 'Healthcare',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'education', 'referees', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'NurseClinicalLayout',
  },

  // 🔬 Science (1)
  {
    template_id: 'research-scientist',
    name: 'Research Scientist',
    description: 'Academic and research-focused portfolio for scientists',
    category: 'Science',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'education', 'projects', 'referees', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'ResearchScientistLayout',
  },

  // 🎓 Education (1)
  {
    template_id: 'teacher-educator',
    name: 'Teacher & Educator',
    description: 'Education-focused portfolio for teachers and educators',
    category: 'Education',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'education', 'projects', 'referees', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'TeacherEducatorLayout',
  },

  // 🍽 Hospitality (2)
  {
    template_id: 'chef-culinary',
    name: 'Chef & Culinary Professional',
    description: 'Culinary arts portfolio for chefs and food professionals',
    category: 'Hospitality',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'projects', 'education', 'referees', 'family_community'],
    media_support: { avatar: true, banner: true, video: false },
    layout_component: 'ChefCulinaryLayout',
  },
  {
    template_id: 'event-planner',
    name: 'Event Planner',
    description: 'Event management portfolio for planners and coordinators',
    category: 'Hospitality',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'projects', 'referees', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'EventPlannerLayout',
  },

  // ➕ Additional (3)
  {
    template_id: 'financial-analyst',
    name: 'Financial Analyst',
    description: 'Finance-focused portfolio for analysts and advisors',
    category: 'Additional',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'FinancialAnalystLayout',
  },
  {
    template_id: 'hr-specialist',
    name: 'HR Specialist',
    description: 'Human resources portfolio for HR professionals',
    category: 'Additional',
    featured: false,
    supported_sections: ['intro', 'social', 'skills', 'experience', 'projects', 'education', 'family_community'],
    media_support: { avatar: true, banner: false, video: false },
    layout_component: 'HRSpecialistLayout',
  },
  {
    template_id: 'architect',
    name: 'Architect',
    description: 'Architecture portfolio for designers and planners',
    category: 'Additional',
    featured: false,
    supported_sections: ['intro', 'social', 'experience', 'projects', 'education', 'attachments', 'family_community'],
    media_support: { avatar: true, banner: true, video: false },
    layout_component: 'ArchitectLayout',
  },
]

// Validation: Ensure exactly 20 templates
if (CANONICAL_PORTFOLIO_TEMPLATES.length !== 20) {
  throw new Error(`CRITICAL: Template registry must contain exactly 20 templates. Found: ${CANONICAL_PORTFOLIO_TEMPLATES.length}`)
}

// Helper functions
export function getTemplateById(id: TemplateId): PortfolioTemplate | undefined {
  return CANONICAL_PORTFOLIO_TEMPLATES.find(t => t.template_id === id)
}

export function getTemplatesByCategory(category: TemplateCategory): PortfolioTemplate[] {
  return CANONICAL_PORTFOLIO_TEMPLATES.filter(t => t.category === category)
}

export function getFeaturedTemplates(): PortfolioTemplate[] {
  return CANONICAL_PORTFOLIO_TEMPLATES.filter(t => t.featured)
}

export function getAllTemplateCategories(): TemplateCategory[] {
  const categories = new Set(CANONICAL_PORTFOLIO_TEMPLATES.map(t => t.category))
  return Array.from(categories).sort()
}

export function getAllTemplateIds(): TemplateId[] {
  return CANONICAL_PORTFOLIO_TEMPLATES.map(t => t.template_id)
}
