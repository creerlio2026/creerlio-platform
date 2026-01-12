'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/peopleselect" className="flex items-center">
            <span className="text-2xl font-bold text-black">PeopleSelect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/peopleselect/services" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              Services
            </Link>
            <Link href="/peopleselect/how-it-works" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              How It Works
            </Link>
            <Link href="/peopleselect/talent-network" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              Talent Network
            </Link>
            <Link href="/peopleselect/for-employers" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              For Employers
            </Link>
            <Link href="/peopleselect/for-candidates" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              For Candidates
            </Link>
            <Link href="/peopleselect/about" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              About
            </Link>
            <Link href="/peopleselect/faq" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
              FAQ
            </Link>
            <Link
              href="/peopleselect/contact"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Book a Call
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link href="/peopleselect/services" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                Services
              </Link>
              <Link href="/peopleselect/how-it-works" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                How It Works
              </Link>
              <Link href="/peopleselect/talent-network" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                Talent Network
              </Link>
              <Link href="/peopleselect/for-employers" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                For Employers
              </Link>
              <Link href="/peopleselect/for-candidates" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                For Candidates
              </Link>
              <Link href="/peopleselect/about" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                About
              </Link>
              <Link href="/peopleselect/faq" className="text-gray-700 hover:text-black transition-colors text-sm font-medium">
                FAQ
              </Link>
              <Link
                href="/peopleselect/contact"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold inline-block w-fit"
              >
                Book a Call
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
