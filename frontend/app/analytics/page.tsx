'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page - Analytics page is hidden
    router.replace('/')
  }, [router])

  return null
}
