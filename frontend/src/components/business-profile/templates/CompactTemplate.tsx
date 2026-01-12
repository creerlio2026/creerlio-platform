'use client'

import type { BusinessProfilePageData } from '../types'

export function CompactTemplate({ data }: { data: BusinessProfilePageData }) {
  const name = data.name || 'Business'
  const heroSubtitle = data.tagline?.trim() || `Turn potential into impact with ${name}.`
  const valueHeadline = data.value_prop_headline?.trim() || 'Bring your ambition to us'
  const valueBody = data.value_prop_body?.trim() || 'Build future-focused skills, collaborate with high-trust teams, and do meaningful work that improves customer and community outcomes.'
  const areas = Array.isArray(data.business_areas) ? data.business_areas : []
  const benefits = Array.isArray(data.benefits) ? data.benefits : []
  const programs = Array.isArray(data.programs) ? data.programs : []
  const social = Array.isArray(data.social_proof) ? data.social_proof : []

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Compact Hero */}
      <section className="border-b border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-4">
            {data.logo_url && (
              <img src={data.logo_url} alt={`${name} logo`} className="h-12 w-auto" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
              <p className="text-gray-600 mt-1">{heroSubtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Value Prop */}
      <section className="py-8 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{valueHeadline}</h2>
          <p className="text-gray-700">{valueBody}</p>
        </div>
      </section>

      {/* Compact Impact Metrics */}
      {data.impact_stats && data.impact_stats.length > 0 && (
        <section className="py-6 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.impact_stats.map((s, idx) => (
                <div key={`${s.label}-${idx}`} className="border border-gray-200 rounded p-4">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-600 mt-1">{s.label}</div>
                  {s.footnote_optional && (
                    <div className="text-xs text-gray-500 mt-1">{s.footnote_optional}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compact Programs */}
      {programs.length > 0 && (
        <section className="py-8 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Programs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {programs.map((p, idx) => (
                <div key={`${p.title}-${idx}`} className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compact Culture Values */}
      {data.culture_values && data.culture_values.length > 0 && (
        <section className="py-8 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Values</h2>
            <div className="flex flex-wrap gap-2">
              {data.culture_values.map((v, i) => (
                <span key={`${v}-${i}`} className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compact Benefits */}
      {benefits.length > 0 && (
        <section className="py-8 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {benefits.map((b, idx) => (
                <div key={`${b.title}-${idx}`} className="border border-gray-200 rounded p-4">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{b.title}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compact Business Areas */}
      {areas.length > 0 && (
        <section className="py-8 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Business Areas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {areas.map((a, idx) => (
                <div key={`${a.title}-${idx}`} className="border border-gray-200 rounded p-4">
                  <p className="font-semibold text-sm text-gray-900">{a.title}</p>
                  {a.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Compact Social Proof */}
      {social.length > 0 && (
        <section className="py-8">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Testimonials</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {social.map((s, idx) => (
                <div key={`${idx}`} className="border border-gray-200 rounded p-4">
                  <p className="text-sm text-gray-700 mb-2 line-clamp-3">"{s.quote}"</p>
                  {(s.author || s.context) && (
                    <p className="text-xs text-gray-500">
                      {s.author && <span className="font-medium">{s.author}</span>}
                      {s.context && <span className="ml-2">{s.context}</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
