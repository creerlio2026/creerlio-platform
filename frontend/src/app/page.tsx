'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapboxMap = dynamic(() => import('../components/MapboxMap'), { ssr: false });

export default function HomePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white'>
      
      {/* Header */}
      <header className='sticky top-0 z-50 backdrop-blur bg-slate-950/70 border-b border-white/10'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='text-xl font-bold'>Creerlio</div>
          <nav className='flex items-center gap-6 text-sm text-slate-300'>
            <Link href='#about'>About</Link>
            <Link href='#talent'>Talent</Link>
            <Link href='#business'>Business</Link>
            <Link href='#search'>Search</Link>
            <Link href='/login'>Login</Link>
            <Link href='/register' className='px-4 py-2 rounded bg-blue-500 text-white'>Free Trial</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className='max-w-7xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center'>
        <div className='space-y-8'>
          <h1 className='text-5xl lg:text-6xl font-extrabold leading-tight'>
            Creerlio  The AI Powered<br />
            <span className='text-blue-400 glow-text'>Talent & Business</span> Platform
          </h1>
          <p className='text-lg text-slate-300 max-w-xl'>
            Smarter hiring, deeper talent insight, and proactive workforce strategy.
            Creerlio connects businesses and talent through AI-powered matching,
            location intelligence, and dynamic portfolios.
          </p>
          <div className='flex gap-4'>
            <Link href='/register' className='px-6 py-3 rounded bg-blue-500 font-semibold'>
              Get Started
            </Link>
            <Link href='/dashboard/talent' className='px-6 py-3 rounded border border-white/20'>
              View Talent
            </Link>
          </div>
        </div>

        {/* Map */}
        <div className='relative h-[420px] rounded-3xl overflow-hidden border border-blue-500/20 bg-slate-900/60'>
          <MapboxMap />
        </div>
      </section>

      {/* Metrics */}
      <section className='max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 gap-12'>
        <div>
          <div className='text-4xl font-bold text-green-400'>84.38%</div>
          <div className='text-slate-400'>Match Accuracy</div>
        </div>
        <div>
          <div className='text-4xl font-bold text-blue-400'>655K</div>
          <div className='text-slate-400'>Active Talent</div>
        </div>
      </section>

      {/* Features */}
      <section className='max-w-7xl mx-auto px-6 py-24 space-y-12'>
        <h2 className='text-3xl font-bold'>Feature Set</h2>

        <div className='grid md:grid-cols-3 gap-8'>
          <div className='dashboard-card p-8 rounded-xl'>
            <h3 className='font-semibold text-xl mb-2'>Rich Multimedia Portfolios</h3>
            <p className='text-slate-400'>Video, credentials, projects, and interactive talent profiles.</p>
          </div>
          <div className='dashboard-card p-8 rounded-xl'>
            <h3 className='font-semibold text-xl mb-2'>Business Intelligence</h3>
            <p className='text-slate-400'>AI matching, analytics, and proactive hiring insights.</p>
          </div>
          <div className='dashboard-card p-8 rounded-xl'>
            <h3 className='font-semibold text-xl mb-2'>Location Intelligence</h3>
            <p className='text-slate-400'>Map-based insight into talent density and commute zones.</p>
          </div>
        </div>
      </section>

    </main>
  );
}
