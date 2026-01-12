// ============================================
// Business Profile Templates
// ============================================

import type { BusinessProfileTemplate } from './types'

export const BUSINESS_PROFILE_TEMPLATES: Record<string, BusinessProfileTemplate> = {
  'employer-brand': {
    id: 'employer-brand',
    name: 'Employer Brand / Careers-Focused',
    description: 'Modern, engaging layout perfect for talent attraction with interactive components',
    defaultBlocks: [
      {
        type: 'hero',
        data: {
          heading: 'Join Our Team',
          subheading: 'Build your career with us',
          ctaText: 'View Opportunities',
          ctaLink: '#opportunities',
        },
      },
      {
        type: 'text-media',
        data: {
          heading: 'Why Work With Us',
          text: 'We offer a dynamic environment where you can grow, learn, and make an impact. Our team is passionate about innovation and collaboration.',
          layout: 'text-left',
        },
      },
      {
        type: 'image-gallery',
        data: {
          images: [],
          columns: 3,
        },
      },
      {
        type: 'stats',
        data: {
          stats: [
            { value: '100+', label: 'Team Members' },
            { value: '5', label: 'Offices' },
            { value: '10+', label: 'Years in Business' },
          ],
        },
      },
      {
        type: 'benefits-culture',
        data: {
          title: 'Culture Highlights',
          items: [
            { title: 'Flexible Work', description: 'Work from anywhere' },
            { title: 'Growth Opportunities', description: 'Career development programs' },
            { title: 'Great Team', description: 'Collaborative environment' },
          ],
        },
      },
      {
        type: 'expandable-roles',
        data: {
          categories: [
            { title: 'Sales', description: 'Drive growth and build relationships' },
            { title: 'Technology', description: 'Build innovative solutions' },
            { title: 'Operations', description: 'Keep things running smoothly' },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          heading: 'Ready to Join Us?',
          text: 'Explore our open positions and start your journey with us.',
          buttonText: 'View Open Roles',
          buttonLink: '/jobs',
          variant: 'primary',
        },
      },
    ],
    styles: {
      primaryColor: '#3b82f6',
      spacing: 'spacious',
    },
  },
  'visual-culture': {
    id: 'visual-culture',
    name: 'Visual / Story-Led',
    description: 'Media-rich layout with carousel, animated stats, and inline video',
    defaultBlocks: [
      {
        type: 'hero',
        data: {
          heading: 'Our Story',
          subheading: 'Where passion meets purpose',
          ctaText: 'See Our Story',
          ctaLink: '#culture',
        },
      },
      {
        type: 'text-media',
        data: {
          heading: 'Life at Our Company',
          text: 'Experience our vibrant culture through the eyes of our team.',
          layout: 'text-left',
        },
      },
      {
        type: 'image-carousel',
        data: {
          images: [],
          autoplay: false,
        },
      },
      {
        type: 'stats',
        data: {
          stats: [
            { value: '500+', label: 'Team Members' },
            { value: '50+', label: 'Countries' },
            { value: '15+', label: 'Years' },
          ],
        },
      },
      {
        type: 'video',
        data: {
          videoUrl: '',
          caption: 'Hear from our team',
        },
      },
      {
        type: 'benefits-culture',
        data: {
          title: 'Our Values',
          items: [
            { title: 'Innovation', description: 'We push boundaries' },
            { title: 'Collaboration', description: 'Together we achieve more' },
            { title: 'Impact', description: 'Making a difference' },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          heading: 'Be Part of Our Story',
          buttonText: 'Join Our Team',
          buttonLink: '/jobs',
          variant: 'primary',
        },
      },
    ],
    styles: {
      primaryColor: '#8b5cf6',
      spacing: 'standard',
    },
  },
  'simple-corporate': {
    id: 'simple-corporate',
    name: 'Compact / Modern Corporate',
    description: 'Clean, professional layout with accordion sections and hover preview',
    defaultBlocks: [
      {
        type: 'hero',
        data: {
          heading: 'Welcome',
          subheading: 'Professional excellence since day one',
        },
      },
      {
        type: 'accordion',
        data: {
          title: 'About Us',
          items: [
            {
              title: 'Our Mission',
              content: 'We are a leading company in our industry, committed to excellence and innovation.',
            },
            {
              title: 'Our Culture',
              content: 'We foster a collaborative environment where every team member can thrive and grow.',
            },
            {
              title: 'Our Benefits',
              content: 'Competitive compensation, comprehensive benefits, and opportunities for professional development.',
            },
          ],
          allowMultiple: false,
        },
      },
      {
        type: 'image-gallery',
        data: {
          images: [],
          columns: 4,
        },
      },
      {
        type: 'stats',
        data: {
          stats: [
            { value: '50+', label: 'Employees' },
            { value: 'Est. 2010', label: 'Founded' },
          ],
        },
      },
      {
        type: 'expandable-roles',
        data: {
          categories: [
            { title: 'Sales', description: 'Drive growth and build relationships' },
            { title: 'Operations', description: 'Keep things running smoothly' },
          ],
        },
      },
      {
        type: 'cta',
        data: {
          buttonText: 'View Careers',
          buttonLink: '/jobs',
          variant: 'secondary',
        },
      },
    ],
    styles: {
      primaryColor: '#1e40af',
      spacing: 'compact',
    },
  },
}

export function getTemplate(templateId: string): BusinessProfileTemplate | null {
  return BUSINESS_PROFILE_TEMPLATES[templateId] || null
}

export function getAllTemplates(): BusinessProfileTemplate[] {
  return Object.values(BUSINESS_PROFILE_TEMPLATES)
}
