import Link from 'next/link'

export default function BusinessAreaPage({ params }: { params: { business_slug: string; area_slug: string } }) {
  const { business_slug, area_slug } = params
  const areaTitle = area_slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl hover:text-blue-300 transition-colors">
            Creerlio
          </Link>
          <Link
            href={`/business/${business_slug}`}
            className="px-4 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 transition-colors"
          >
            ← Back to Business
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold">{areaTitle}</h1>
        <p className="text-slate-300 mt-3 max-w-2xl">
          Discover roles, teams, and growth pathways in this area.
        </p>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-xl font-bold mb-2">Live roles</h2>
            <p className="text-slate-400">
              Coming soon. This will list live roles for this business area.
            </p>
            {/* TODO: AI_MATCH_SCORE */}
            {/* TODO: TALENT_RECOMMENDATIONS */}
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
            <h2 className="text-xl font-bold mb-2">Join the talent community</h2>
            <p className="text-slate-400">
              Maintain a long-term relationship with the business, with no obligation.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-semibold"
                onClick={() => {}}
              >
                Join Talent Community
              </button>
              <Link
                href="/portfolio"
                className="px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold text-center"
              >
                Share Portfolio
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


