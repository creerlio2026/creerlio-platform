'use client'

import type { BusinessProfilePageData } from '../types'
import { ImpactMetrics } from '../ImpactMetrics'

export function VisualTemplate({ data }: { data: BusinessProfilePageData }) {
  const name = data.name || 'Business'
  const heroSubtitle = data.tagline?.trim() || `Turn potential into impact with ${name}.`
  const valueHeadline = data.value_prop_headline?.trim() || 'Bring your ambition to us'
  const valueBody = data.value_prop_body?.trim() || 'Build future-focused skills, collaborate with high-trust teams, and do meaningful work that improves customer and community outcomes.'
  const areas = Array.isArray(data.business_areas) ? data.business_areas : []
  const benefits = Array.isArray(data.benefits) ? data.benefits : []
  const programs = Array.isArray(data.programs) ? data.programs : []
  const social = Array.isArray(data.social_proof) ? data.social_proof : []
  const media = Array.isArray(data.media_assets) ? data.media_assets : []
  const mediaImages = media.filter((m) => m?.kind === 'image' && typeof m?.url === 'string')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Large Hero with Image */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {data.hero_image_url ? (
          <img
            src={data.hero_image_url}
            alt={`${name} hero`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {data.logo_url && (
            <div className="mb-8 flex justify-center">
              <img src={data.logo_url} alt={`${name} logo`} className="h-24 w-auto drop-shadow-2xl" />
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg">{name}</h1>
          <p className="text-2xl md:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-md">{heroSubtitle}</p>
        </div>
      </section>

      {/* Value Proposition with Visual Emphasis */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{valueHeadline}</h2>
              <p className="text-xl text-slate-300 leading-relaxed">{valueBody}</p>
            </div>
            {mediaImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {mediaImages.slice(0, 4).map((m, idx) => (
                  <div key={`${m.url}-${idx}`} className="rounded-2xl overflow-hidden aspect-square">
                    <img src={m.url} alt="Gallery" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <ImpactMetrics stats={data.impact_stats} />

      {/* Programs with Visual Cards */}
      {programs.length > 0 && (
        <section className="py-20 bg-slate-950">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-center">Career streams & programs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {programs.map((p, idx) => (
                <div
                  key={`${p.title}-${idx}`}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 hover:border-blue-500 transition-colors"
                >
                  <h3 className="font-bold text-xl mb-4">{p.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Culture Values with Visual Pills */}
      {data.culture_values && data.culture_values.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-12">Our Values</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {data.culture_values.map((v, i) => (
                <span
                  key={`${v}-${i}`}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits with Visual Cards */}
      {benefits.length > 0 && (
        <section className="py-20 bg-slate-950">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-center">Benefits & wellbeing</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((b, idx) => (
                <div
                  key={`${b.title}-${idx}`}
                  className="bg-slate-800 rounded-2xl border border-slate-700 p-8 hover:border-blue-500 transition-colors"
                >
                  <p className="font-bold text-xl mb-3">{b.title}</p>
                  <p className="text-slate-300">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Business Areas */}
      {areas.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-center">Business areas</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areas.map((a, idx) => (
                <div
                  key={`${a.title}-${idx}`}
                  className="bg-slate-800 rounded-2xl border border-slate-700 p-8 hover:border-blue-500 transition-colors"
                >
                  <p className="font-bold text-xl mb-2">{a.title}</p>
                  {a.description && <p className="text-slate-300">{a.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof */}
      {social.length > 0 && (
        <section className="py-20 bg-slate-950">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-12 text-center">What people say</h2>
            <div className="space-y-6">
              {social.map((s, idx) => (
                <div key={`${idx}`} className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
                  <p className="text-xl text-slate-200 leading-relaxed mb-4">"{s.quote}"</p>
                  {(s.author || s.context) && (
                    <p className="text-slate-400">
                      {s.author && <span className="font-semibold text-white">{s.author}</span>}
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
