'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/peopleselect/Header'
import { Footer } from '@/components/peopleselect/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    type: 'employer' as 'employer' | 'candidate'
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would send data to a backend/API
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-black mb-6">Get in Touch</h1>
            <p className="text-xl text-gray-600">
              Book a discovery call or send us a message. We'll respond within 24 hours.
            </p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="max-w-3xl mx-auto px-6 lg:px-8 py-20">
          <div className="bg-white border border-gray-200 rounded-lg p-8 lg:p-12">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-black mb-4">Message Sent</h2>
                <p className="text-gray-600 mb-8">
                  Thank you for getting in touch. We'll respond within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-semibold text-black mb-2">
                    I am
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="employer"
                        checked={formData.type === 'employer'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'employer' | 'candidate' })}
                        className="mr-2"
                      />
                      <span className="text-gray-700">An Employer</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="candidate"
                        checked={formData.type === 'candidate'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'employer' | 'candidate' })}
                        className="mr-2"
                      />
                      <span className="text-gray-700">A Candidate</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                {formData.type === 'employer' && (
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-black mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-black mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-black mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder={
                      formData.type === 'employer'
                        ? "Tell us about your hiring needs, timeline, and what you're looking for..."
                        : "Tell us about your career goals, experience, and what you're looking for..."
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Booking CTA */}
          <div className="mt-12 text-center">
            <div className="bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-black mb-4">Prefer to Book a Call?</h2>
              <p className="text-gray-600 mb-6">
                Schedule a discovery call at a time that works for you.
              </p>
              <div className="bg-gray-200 rounded-lg p-8">
                <p className="text-gray-600 mb-4">
                  Calendly or booking widget would be embedded here
                </p>
                <p className="text-sm text-gray-500">
                  In a production implementation, this would integrate with a booking system like Calendly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
