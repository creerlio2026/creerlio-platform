'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white text-xl font-bold mb-4">PeopleSelect</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              A recruitment agency powered by Creerlio. Discovery first. Recruitment second. Human-led always. No resumes. No ATS systems. No algorithms.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/peopleselect/how-it-works" className="hover:text-white transition-colors text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/peopleselect/why-people-select" className="hover:text-white transition-colors text-sm">
                  Why PeopleSelect
                </Link>
              </li>
              <li>
                <Link href="/peopleselect/about" className="hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/peopleselect/faq" className="hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/peopleselect/contact" className="hover:text-white transition-colors text-sm">
                  Get in Touch
                </Link>
              </li>
              <li>
                <Link href="/peopleselect/for-employers" className="hover:text-white transition-colors text-sm">
                  For Businesses
                </Link>
              </li>
              <li>
                <Link href="/peopleselect/for-candidates" className="hover:text-white transition-colors text-sm">
                  For Talent
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} PeopleSelect. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Powered by Creerlio
          </p>
        </div>
      </div>
    </footer>
  )
}
