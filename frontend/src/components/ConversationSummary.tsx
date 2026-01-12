'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ConversationSummaryProps {
  sessionId: string
  onClose: () => void
}

export default function ConversationSummary({ sessionId, onClose }: ConversationSummaryProps) {
  const [summary, setSummary] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [sessionId])

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: sessionRes } = await supabase.auth.getSession()
      if (!sessionRes?.session?.user) {
        throw new Error('Not authenticated')
      }
      
      const accessToken = sessionRes.session.access_token
      
      const response = await fetch(`/api/video-chat/${sessionId}/summary`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to load summary')
      }
      
      const data = await response.json()
      
      if (data.success && data.summary) {
        setSummary(data.summary)
      } else {
        setSummary(null) // No summary yet
      }
    } catch (err: any) {
      console.error('[ConversationSummary] Error loading summary:', err)
      setError(err.message || 'Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async () => {
    setGenerating(true)
    setError(null)
    try {
      // Call FastAPI backend to generate summary
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const { data: sessionRes } = await supabase.auth.getSession()
      
      if (!sessionRes?.session?.user?.email) {
        throw new Error('Not authenticated')
      }
      
      const response = await fetch(`${backendUrl}/api/video-chat/${sessionId}/generate-summary?email=${encodeURIComponent(sessionRes.session.user.email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to generate summary')
      }
      
      setSummary(data.summary)
      setGenerating(false)
    } catch (err: any) {
      console.error('[ConversationSummary] Error generating summary:', err)
      setError(err.message || 'Failed to generate summary')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <p className="text-gray-400 text-center">Loading summary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Conversation Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 border border-red-500/30 bg-red-500/10 text-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!summary && !generating && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No summary available yet.</p>
            <p className="text-gray-500 text-sm mb-6">
              A summary will be automatically generated after the recording is transcribed.
            </p>
            <button
              onClick={generateSummary}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Generate Summary (if recording available)
            </button>
          </div>
        )}

        {generating && (
          <div className="text-center py-8">
            <p className="text-gray-400">Generating summary...</p>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Summary Text */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{summary.summary_text}</p>
            </div>

            {/* Key Points */}
            {summary.key_points && Array.isArray(summary.key_points) && summary.key_points.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Key Points</h3>
                <ul className="space-y-2">
                  {summary.key_points.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.action_items && Array.isArray(summary.action_items) && summary.action_items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Action Items</h3>
                <ul className="space-y-2">
                  {summary.action_items.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Topics */}
            {summary.topics && Array.isArray(summary.topics) && summary.topics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Topics Discussed</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-lg text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment */}
            {summary.sentiment && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Sentiment</h3>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  summary.sentiment === 'positive' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                  summary.sentiment === 'negative' ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                  'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                }`}>
                  {summary.sentiment.charAt(0).toUpperCase() + summary.sentiment.slice(1)}
                </span>
              </div>
            )}

            {/* Metadata */}
            {summary.ai_model_used && (
              <div className="pt-4 border-t border-gray-800">
                <p className="text-gray-500 text-xs">
                  Generated using {summary.ai_model_used}
                  {summary.processed_at && ` • ${new Date(summary.processed_at).toLocaleString()}`}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
