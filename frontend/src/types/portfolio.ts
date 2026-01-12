export interface PortfolioData {
  name: string
  title: string
  bio: string
  avatar_path?: string | null
  banner_path?: string | null
  sectionOrder?: string[]
  introVideoId?: number | null
  socialLinks: Array<{
    platform: string
    url: string
  }>
  skills: string[]
  experience: Array<{
    company: string
    title: string
    startDate: string
    endDate: string
    description: string
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    year: string
  }>
  referees: Array<{
    name: string
    relationship: string
    company: string
    title: string
    email: string
    phone: string
    notes: string
  }>
  attachments: Array<{
    id: number
    title: string
    item_type: string
    file_path: string | null
    file_type: string | null
    url: string | null
  }>
  projects: Array<{
    name: string
    description: string
    url: string
    attachmentIds?: number[]
  }>
}

export interface PortfolioTemplateProps {
  data: PortfolioData
  selectedSections?: string[]
}
