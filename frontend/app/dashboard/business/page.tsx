'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to business profile edit page for building profile
    router.push('/dashboard/business/edit')
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to Business Profile...</p>
      </div>
    </div>
  )
}
