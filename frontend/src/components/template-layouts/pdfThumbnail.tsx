/**
 * PDF Thumbnail Component
 * Renders the first page of a PDF as a thumbnail
 */

'use client'

import { useEffect, useRef, useState } from 'react'

let pdfJsLibPromise: Promise<any> | null = null
function loadPdfJsLib() {
  if (pdfJsLibPromise) return pdfJsLibPromise
  pdfJsLibPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('pdfjs can only load in the browser'))
    const w = window as any
    if (w.pdfjsLib) return resolve(w.pdfjsLib)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.async = true
    script.onload = () => {
      if (w.pdfjsLib) {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(w.pdfjsLib)
      } else {
        reject(new Error('Failed to load pdfjs'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load pdfjs script'))
    document.head.appendChild(script)
  })
  return pdfJsLibPromise
}

interface PDFThumbnailProps {
  url: string
  className?: string
  onError?: () => void
}

export function PDFThumbnail({ url, className = '', onError }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function renderPDF() {
      if (!canvasRef.current || !url) return

      try {
        setLoading(true)
        setError(false)

        const pdfjsLib = await loadPdfJsLib()
        const loadingTask = pdfjsLib.getDocument({ url })
        const pdf = await loadingTask.promise

        if (cancelled) return

        // Get first page
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 0.5 })

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise

        if (!cancelled) {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error rendering PDF thumbnail:', err)
        if (!cancelled) {
          setError(true)
          setLoading(false)
          if (onError) onError()
        }
      }
    }

    renderPDF()

    return () => {
      cancelled = true
    }
  }, [url, onError])

  if (error) {
    return (
      <div className={`w-full h-48 bg-slate-50 flex items-center justify-center border border-slate-200 ${className}`}>
        <div className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">
          PDF
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-48 bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
    </div>
  )
}
