'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import MapboxMap from '@/components/MapboxMap'

interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  user_type: string
}

export default function BusinessDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    const storedUserType = localStorage.getItem('user_type')
    
    setIsAuthenticated(!!token && !!email)
    if (storedUserType) {
      setUserType(storedUserType)
    }

    if (token && email) {
      fetchUserInfo(email)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUserInfo = async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/auth/me?email=${email}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_type')
    setIsAuthenticated(false)
    setUserType(null)
    router.push('/')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({ email, firstName, lastName })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-white text-2xl font-bold">Creerlio</span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-x-8 text-sm text-slate-300">
          <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
          <Link href="/dashboard/talent" className="hover:text-blue-400 transition-colors">Talent</Link>
          <Link href="/dashboard/business" className="hover:text-blue-400 transition-colors">Business</Link>
          <Link href="/analytics" className="hover:text-blue-400 transition-colors">Analytics</Link>
          <Link href="/search" className="hover:text-blue-400 transition-colors">Search</Link>
          <Link href="/jobs" className="hover:text-blue-400 transition-colors">Jobs</Link>
          {isAuthenticated ? (
            <>
              <Link 
                href={userType === 'business' ? '/dashboard/business' : '/dashboard/talent'} 
                className="hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="hover:text-blue-400 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-400 transition-colors">Login</Link>
              <Link href="/register" className="hover:text-blue-400 transition-colors">Register</Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <span className="text-gray-300">Welcome, {user?.full_name || user?.username}</span>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Business Dashboard</h1>
          <p className="text-gray-400">Next Gen Recruitment Solutions</p>
        </div>

        {/* Hero Section with Benefits */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <ul className="space-y-3 text-white text-lg">
                <li>NO MORE expensive Job Ads and Recruitment Fees</li>
                <li>NO MORE sifting through 100s of Resumes</li>
                <li>MORE Quality Talent</li>
                <li>MORE Productivity</li>
                <li>and MORE Profit for your Business with <span className="text-blue-400">CREERLIO</span></li>
              </ul>
              <h2 className="text-3xl font-bold text-white mt-8">Future Employment Relationships begin NOW!</h2>
            </div>
            <div 
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                isMapExpanded 
                  ? 'fixed inset-0 z-50 h-screen w-screen' 
                  : 'h-96'
              }`}
              onClick={() => !isMapExpanded && setIsMapExpanded(true)}
            >
              <MapboxMap className="w-full h-full" />
              {isMapExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMapExpanded(false)
                  }}
                  className="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                >
                  Close
                </button>
              )}
              {!isMapExpanded && (
                <div className="absolute bottom-4 right-4">
                  <div className="px-3 py-1 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-white text-sm font-medium">
                    Click to expand
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cost Efficiency Section */}
        <section className="mb-12 border-t border-gray-800 pt-12">
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
        </section>

        {/* Quality of Talent Section */}
        <section className="mb-12 border-t border-gray-800 pt-12">
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
        </section>

        {/* Engagement and Relationships Section */}
        <section className="mb-12 border-t border-gray-800 pt-12">
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
        </section>

        {/* Future Planning Section */}
        <section className="mb-12 border-t border-gray-800 pt-12">
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
        </section>

        {/* Seamless Integration Section */}
        <section className="mb-12 border-t border-gray-800 pt-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,100,0,0.5) 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <div className="relative z-10">
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
                  Integrate <span className="text-blue-400 font-semibold">CREERLIO</span> seamlessly with your existing Website. Our flexible integration capabilities allow you to connect our HR software with your preferred tools and platforms, maximizing efficiency and productivity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join the Waitlist Section */}
        <section className="mb-12 border-t border-gray-800 pt-12">
          <h2 className="text-4xl font-bold text-blue-400 text-center mb-12">JOIN THE WAITLIST</h2>
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
                    className="w-full px-4 py-2 bg-slate-800/50 border border-gray-700 rounded text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-gray-700 rounded text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-gray-700 rounded text-white placeholder-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  JOIN
                </button>
              </form>
            </div>
            <div className="text-gray-400 text-right">
              <p>© 2024 <span className="text-blue-400">Creerlio</span>. All rights reserved.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Chat Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
