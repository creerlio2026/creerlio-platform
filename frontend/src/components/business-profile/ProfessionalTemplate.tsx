'use client'

import Link from 'next/link'

interface BusinessBankItem {
  id: number
  title: string
  description?: string | null
  file_url?: string | null
  item_type: string
  metadata?: any
}

interface ProfessionalTemplateProps {
  businessName: string
  config: {
    hero?: {
      background_image_id?: number
      logo_id?: number
    }
    about?: {
      text_id?: number
      image_id?: number
    }
    culture?: {
      image_ids?: number[]
      video_id?: number
    }
    links?: {
      website?: string
      linkedin?: string
      twitter?: string
      facebook?: string
    }
    careers?: {
      text_id?: number
    }
  }
  bankItems: Record<number, BusinessBankItem>
  editMode?: boolean
}

export function ProfessionalTemplate({
  businessName,
  config,
  bankItems,
  editMode = false,
}: ProfessionalTemplateProps) {
  const heroBg = config.hero?.background_image_id
    ? bankItems[config.hero.background_image_id]
    : null
  const logo = config.hero?.logo_id ? bankItems[config.hero.logo_id] : null
  const aboutText = config.about?.text_id ? bankItems[config.about.text_id] : null
  const aboutImage = config.about?.image_id ? bankItems[config.about.image_id] : null
  const cultureImages = config.culture?.image_ids
    ?.map((id) => bankItems[id])
    .filter(Boolean) || []
  const cultureVideo = config.culture?.video_id ? bankItems[config.culture.video_id] : null
  const careersText = config.careers?.text_id ? bankItems[config.careers.text_id] : null

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative bg-gray-900 text-white"
        style={{
          minHeight: '60vh',
          backgroundImage: heroBg?.file_url
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroBg.file_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
          {logo?.file_url && (
            <div className="mb-8">
              <img
                src={logo.file_url}
                alt={logo.title}
                className="max-h-32 max-w-xs object-contain"
              />
            </div>
          )}
          <h1 className="text-5xl font-bold mb-4">{businessName}</h1>
          {heroBg?.description && (
            <p className="text-xl text-gray-300 max-w-2xl">{heroBg.description}</p>
          )}
        </div>
      </section>

      {/* About Section */}
      {(aboutText || aboutImage) && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">About Us</h2>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {aboutText && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {aboutText.title}
                    </h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {aboutText.description || aboutText.metadata?.content}
                    </div>
                  </div>
                )}
                {aboutImage && aboutImage.file_url && (
                  <div>
                    <img
                      src={aboutImage.file_url}
                      alt={aboutImage.title}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Culture Section */}
      {(cultureImages.length > 0 || cultureVideo) && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Culture</h2>
              {cultureVideo && cultureVideo.file_url && (
                <div className="mb-12">
                  <video
                    src={cultureVideo.file_url}
                    controls
                    className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
              {cultureImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {cultureImages.map((img) => (
                    <div key={img.id} className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={img.file_url || ''}
                        alt={img.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Careers Section */}
      {careersText && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Join Us</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {careersText.description || careersText.metadata?.content}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Links Section */}
      {config.links && (
        <section className="py-12 bg-gray-100 border-t border-gray-200">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-center gap-6">
                {config.links.website && (
                  <Link
                    href={config.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Website
                  </Link>
                )}
                {config.links.linkedin && (
                  <Link
                    href={config.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    LinkedIn
                  </Link>
                )}
                {config.links.twitter && (
                  <Link
                    href={config.links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Twitter
                  </Link>
                )}
                {config.links.facebook && (
                  <Link
                    href={config.links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Facebook
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
