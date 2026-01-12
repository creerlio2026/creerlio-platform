'use client'

import { useEffect, useRef, useState } from 'react'

interface CollapsibleTextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  expandKey: string
  defaultRows?: number
  expanded: boolean
  onToggle: (key: string) => void
  showVoiceButtons?: boolean
}

// Utility function to detect if background is dark based on className
function isDarkBackground(className: string | undefined): boolean {
  if (!className) return false
  
  // Light background classes (full opacity)
  const lightBgClasses = [
    'bg-white', 'bg-slate-50', 'bg-slate-100', 'bg-gray-50', 'bg-gray-100',
    'bg-zinc-50', 'bg-zinc-100', 'bg-neutral-50', 'bg-neutral-100'
  ]
  
  // Dark background classes (full opacity)
  const darkBgClasses = [
    'bg-black', 'bg-slate-950', 'bg-slate-900', 'bg-slate-800', 'bg-slate-700',
    'bg-gray-950', 'bg-gray-900', 'bg-gray-800', 'bg-gray-700',
    'bg-zinc-950', 'bg-zinc-900', 'bg-zinc-800', 'bg-zinc-700',
    'bg-neutral-950', 'bg-neutral-900', 'bg-neutral-800', 'bg-neutral-700',
    'bg-red-900', 'bg-red-800', 'bg-orange-900', 'bg-orange-800',
    'bg-amber-900', 'bg-yellow-900', 'bg-lime-900',
    'bg-green-900', 'bg-green-800', 'bg-emerald-900', 'bg-emerald-800',
    'bg-teal-900', 'bg-teal-800', 'bg-cyan-900', 'bg-cyan-800',
    'bg-sky-900', 'bg-blue-900', 'bg-blue-800', 'bg-indigo-900', 'bg-indigo-800',
    'bg-violet-900', 'bg-purple-900', 'bg-fuchsia-900', 'bg-pink-900', 'bg-rose-900', 'bg-rose-800'
  ]
  
  // Check for opacity variations (bg-white/5, bg-black/10, etc.)
  // Low opacity white on dark background = dark, high opacity white = light
  const opacityMatch = className.match(/bg-(white|black|slate|gray|zinc|neutral)-\d+\/(\d+)/)
  if (opacityMatch) {
    const bgType = opacityMatch[1]
    const opacity = parseInt(opacityMatch[2], 10)
    
    if (bgType === 'white') {
      // Semi-transparent white (low opacity) on dark background = dark
      // Only consider it light if opacity is high (>= 50)
      return opacity < 50
    } else if (bgType === 'black' || bgType === 'slate' || bgType === 'gray' || bgType === 'zinc' || bgType === 'neutral') {
      // Semi-transparent dark colors = dark
      return true
    }
  }
  
  // Check for light backgrounds first (they take precedence)
  if (lightBgClasses.some(bgClass => new RegExp(`\\b${bgClass}\\b`).test(className))) {
    return false
  }
  
  // Check for dark backgrounds
  if (darkBgClasses.some(bgClass => new RegExp(`\\b${bgClass}\\b`).test(className))) {
    return true
  }
  
  // Default: if no clear background, assume light (will use dark text)
  return false
}

export function CollapsibleTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  expandKey,
  defaultRows = 5,
  expanded,
  onToggle,
  showVoiceButtons = true,
}: CollapsibleTextareaProps) {
  const [isListening, setIsListening] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [interimText, setInterimText] = useState('')
  const baseValueRef = useRef<string>('')
  const finalTranscriptRef = useRef<string>('')
  const shouldContinueListeningRef = useRef<boolean>(false)
  const lineCount = String((value || '') + interimText).split('\n').length
  const needsExpansion = lineCount > defaultRows || String((value || '') + interimText).length > 200

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript
        const newValue = baseValueRef.current + finalTranscriptRef.current
        baseValueRef.current = newValue
        finalTranscriptRef.current = ''
        onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>)
      }

      setInterimText(interimTranscript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      shouldContinueListeningRef.current = false
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please enable microphone permissions in your browser settings.')
      }
    }

    recognition.onend = () => {
      if (shouldContinueListeningRef.current) {
        try {
          recognition.start()
        } catch (error: any) {
          if (error.name !== 'InvalidStateError') {
            console.error('Error restarting speech recognition:', error)
            setIsListening(false)
            shouldContinueListeningRef.current = false
          }
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [value, onChange])

  useEffect(() => {
    if (!isListening) {
      baseValueRef.current = value || ''
      finalTranscriptRef.current = ''
    }
  }, [value, isListening])

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not available in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    try {
      baseValueRef.current = value || ''
      finalTranscriptRef.current = ''
      setInterimText('')
      shouldContinueListeningRef.current = true
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      shouldContinueListeningRef.current = false
      if (error.name !== 'InvalidStateError') {
        setIsListening(false)
      } else {
        alert('Error starting speech recognition. Please try again.')
      }
    }
  }

  const stopListening = () => {
    shouldContinueListeningRef.current = false
    setIsListening(false)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
    setInterimText('')
  }

  const handlePolishText = async () => {
    if (!value || !value.trim()) {
      alert('Please enter some text to polish.')
      return
    }

    setIsPolishing(true)
    try {
      const response = await fetch('/api/ai/polish-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: value }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to polish text')
      }

      const data = await response.json()
      if (data.success && data.polished_text) {
        onChange({ target: { value: data.polished_text } } as React.ChangeEvent<HTMLTextAreaElement>)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error polishing text:', error)
      alert(error.message || 'Failed to polish text. Please check your OpenAI API key is configured.')
    } finally {
      setIsPolishing(false)
    }
  }

  const displayValue = (value || '') + (interimText || '')
  
  // Determine text color based on background
  const isDark = isDarkBackground(className)
  const textColorClass = isDark ? 'text-white placeholder:text-white/50' : 'text-slate-900 placeholder:text-slate-500'
  
  // Combine className with appropriate text color, ensuring text color overrides any existing text color classes
  const baseClassName = className || ''
  // Remove existing text color classes (including placeholder variants)
  const textColorRegex = /(?:^|\s)(?:placeholder:)?text-(white|black|slate-\d+|gray-\d+|zinc-\d+|neutral-\d+)(?:\/[\d]+)?(?=\s|$)/g
  const classNameWithoutTextColor = baseClassName.replace(textColorRegex, '').trim().replace(/\s+/g, ' ')
  const finalClassName = `${classNameWithoutTextColor} ${textColorClass}`.trim()

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={displayValue}
        onChange={onChange}
        disabled={disabled}
        className={finalClassName}
        rows={expanded ? Math.max(defaultRows, lineCount) : defaultRows}
      />
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {showVoiceButtons && !disabled && (
          <>
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded disabled:opacity-50 transition-colors flex items-center gap-1"
                title="Start voice input (Talk to TXT)"
              >
                🎤 Talk to TXT
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded disabled:opacity-50 transition-colors flex items-center gap-1"
                title="Stop voice input"
              >
                ⏹ Stop
              </button>
            )}
            <button
              type="button"
              onClick={handlePolishText}
              disabled={isPolishing || !value || !value.trim()}
              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50 transition-colors flex items-center gap-1"
              title="AI Polish - Fix grammar, spelling, and improve style"
            >
              {isPolishing ? '⏳ Polishing...' : '✨ AI Polish'}
            </button>
          </>
        )}
        {needsExpansion && (
          <button
            type="button"
            onClick={() => onToggle(expandKey)}
            className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 transition-colors"
            disabled={disabled}
          >
            {expanded ? '▲ Show Less' : '▼ Show More'}
          </button>
        )}
      </div>
    </div>
  )
}
