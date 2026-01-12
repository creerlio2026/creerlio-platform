'use client'

import type { BusinessProfilePageData } from '../types'

export function ClassicTemplate({ data }: { data: BusinessProfilePageData }) {
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
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            {data.logo_url && (
              <div className="mb-6 flex justify-center">
                <img src={data.logo_url} alt={`${name} logo`} className="h-16 w-auto" />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{name}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{heroSubtitle}</p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{valueHeadline}</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8">{valueBody}</p>
        </div>
      </section>

      {/* Impact Metrics */}
      {data.impact_stats && data.impact_stats.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Impact at scale</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.impact_stats.map((s, idx) => (
                <div key={`${s.label}-${idx}`} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{s.value}</div>
                  <div className="text-gray-700 mt-2 font-medium">{s.label}</div>
                  {s.footnote_optional && (
                    <div className="text-gray-500 text-sm mt-2">{s.footnote_optional}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Programs */}
      {programs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Career streams & programs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p, idx) => (
                <div key={`${p.title}-${idx}`} className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{p.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Culture Values */}
      {data.culture_values && data.culture_values.length > 0 && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Values</h2>
            <div className="flex flex-wrap gap-3">
              {data.culture_values.map((v, i) => (
                <span key={`${v}-${i}`} className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Benefits & wellbeing</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, idx) => (
                <div key={`${b.title}-${idx}`} className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="font-semibold text-gray-900 mb-2">{b.title}</p>
                  <p className="text-gray-600 text-sm">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Business Areas */}
      {areas.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Business areas</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((a, idx) => (
                <div key={`${a.title}-${idx}`} className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="font-semibold text-gray-900 mb-2">{a.title}</p>
                  {a.description && <p className="text-gray-600 text-sm">{a.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof */}
      {social.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">What people say</h2>
            <div className="space-y-6">
              {social.map((s, idx) => (
                <div key={`${idx}`} className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-700 leading-relaxed mb-4">"{s.quote}"</p>
                  {(s.author || s.context) && (
                    <p className="text-gray-500 text-sm">
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
