'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MapboxMap from '@/components/MapboxMap'

export default function BusinessDashboard() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({ email, firstName, lastName })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-orange-500 text-2xl font-bold">CREERLIO</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">Connect With Us:</span>
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-white hover:bg-gray-800">
                <span className="text-xs font-bold">in</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-white hover:bg-gray-800">
                <span className="text-xs font-bold">f</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-white hover:bg-gray-800">
                <span className="text-xs">🐦</span>
              </a>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white text-center mb-4">Next Gen Recruitment Solutions</h1>
        <nav className="flex justify-center gap-6 border-b border-gray-800 pb-4">
          <Link href="/" className="text-white hover:text-orange-500">Home</Link>
          <Link href="#" className="text-white hover:text-orange-500">Win $500 Hyatt Voucher</Link>
          <Link href="#" className="text-white hover:text-orange-500">Focus Groups</Link>
          <Link href="/dashboard/business" className="text-red-500 font-semibold">CREERLIO for Business</Link>
          <Link href="/dashboard/talent" className="text-white hover:text-orange-500">CREERLIO for Talent</Link>
          <Link href="#" className="text-white hover:text-orange-500">Features</Link>
        </nav>
      </header>

      {/* Hero Section with Benefits */}
      <section className="relative bg-black py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <ul className="space-y-3 text-white text-lg">
                <li>NO MORE expensive Job Ads and Recruitment Fees</li>
                <li>NO MORE sifting through 100s of Resumes</li>
                <li>MORE Quality Talent</li>
                <li>MORE Productivity</li>
                <li>and MORE Profit for your Business with <span className="text-orange-500">CREERLIO</span></li>
              </ul>
              <h2 className="text-3xl font-bold text-white mt-8">Future Employment Relationships begin NOW!</h2>
            </div>
            <div className="relative h-96">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent rounded-lg">
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,0,0,0.5) 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Efficiency Section */}
      <section className="bg-gray-900 py-16 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/c__Users_simon_AppData_Roaming_Cursor_User_workspaceStorage_3d5a983ccaf8155d3784f9813736e5e0_images_Screenshot_2025-12-19_103752-a74e1044-c957-4e10-ad5a-c49225f644d2.png"
                alt="Cost Efficiency"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-300 mb-6">Cost Efficiency</h2>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Reduction in Recruitment Costs:</strong> Eliminates fees paid to external recruiters and agencies.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Lower Advertising Costs:</strong> Reduced need for extensive job advertisements due to direct relationships.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Reduced Time-to-Hire:</strong> Faster recruitment process as businesses already have access to a pool of potential candidates.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quality of Talent Section */}
      <section className="bg-black py-16 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/c__Users_simon_AppData_Roaming_Cursor_User_workspaceStorage_3d5a983ccaf8155d3784f9813736e5e0_images_Screenshot_2025-12-19_103712-389db486-b00c-4be7-ad7a-0443515f8715.png"
                alt="Quality of Talent"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Quality of Talent</h2>
              <ul className="space-y-4 text-gray-400">
                <li>
                  <strong className="text-gray-300">Better Fit:</strong> Enhanced understanding of candidates' skills and cultural fit through comprehensive portfolios.
                </li>
                <li>
                  <strong className="text-gray-300">Informed Decisions:</strong> More data available on candidates' work and achievements, leading to better hiring decisions.
                </li>
                <li>
                  <strong className="text-gray-300">Retention Rates:</strong> Higher retention due to better matches between candidates and company culture.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement and Relationships Section */}
      <section className="bg-gray-900 py-16 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/c__Users_simon_AppData_Roaming_Cursor_User_workspaceStorage_3d5a983ccaf8155d3784f9813736e5e0_images_Screenshot_2025-12-19_103828-b2c20bf6-dadb-4adb-b9b7-48b69e5d2b4e.png"
                alt="Engagement and Relationships"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-300 mb-6">Engagement and Relationships</h2>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Stronger Engagement:</strong> Ongoing interactions build stronger connections between businesses and candidates.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Proactive Talent Management:</strong> Continuous relationship-building allows for proactive workforce planning.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Trust and Loyalty:</strong> Candidates are more likely to commit to a company they have a relationship with.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Future Planning Section */}
      <section className="bg-black py-16 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/c__Users_simon_AppData_Roaming_Cursor_User_workspaceStorage_3d5a983ccaf8155d3784f9813736e5e0_images_Screenshot_2025-12-19_103809-df026577-5ffd-4775-9124-18a961b5715e.png"
                alt="Future Planning"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-300 mb-6">Future Planning</h2>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Succession Planning:</strong> Identify and nurture future leaders within the network of potential candidates.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3"></span>
                  <span><strong className="text-gray-300">Growth and Expansion:</strong> Easily scale the workforce in alignment with business growth strategies.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Seamless Integration Section */}
      <section className="bg-black py-16 px-6 border-t border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,100,0,0.5) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-5xl font-bold text-white mb-2">Seamless</h2>
                <h2 className="text-4xl font-bold text-white mb-2">Integration with Your</h2>
                <h2 className="text-4xl font-bold text-white">Existing Website</h2>
              </div>
            </div>
            <div>
              <p className="text-white text-lg leading-relaxed">
                Integrate <span className="text-orange-500 font-semibold">CREERLIO</span> seamlessly with your existing Website. Our flexible integration capabilities allow you to connect our HR software with your preferred tools and platforms, maximizing efficiency and productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - KEEP THIS */}
      <section className="bg-gray-900 py-16 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="h-[600px] rounded-lg overflow-hidden">
            <MapboxMap className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* Join the Waitlist Section */}
      <section className="bg-black py-16 px-6 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold text-orange-500 text-center mb-12">JOIN THE WAITLIST</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-gray-400">
              <p>100 MOUNT STREET, NORTH SYDNEY,</p>
              <p>NSW 2060, AUSTRALIA</p>
            </div>
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gray-900 border border-gray-600 text-gray-300 rounded hover:bg-gray-800 transition-colors"
                >
                  JOIN
                </button>
              </form>
            </div>
            <div className="text-gray-400 text-right">
              <p>© 2024 <span className="text-orange-500">Creerlio</span>. All rights reserved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
