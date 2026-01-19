'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 bg-black border-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="px-4 py-2 rounded-full bg-[#20C997] text-white text-base font-bold">
              CREERLIO
            </span>
          </Link>
          <Link href="/" className="text-sm text-white hover:text-[#20C997] transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <section className="space-y-3">
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          <p className="text-gray-700">
            These Terms and Conditions govern your use of the Creerlio Platform. By accessing or
            using the platform, you agree to these terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">1. Eligibility and Accounts</h2>
          <p className="text-gray-700">
            You must provide accurate information and keep your account details current. You are
            responsible for activity that occurs under your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">2. Use of the Platform</h2>
          <p className="text-gray-700">
            You agree to use the platform lawfully and not to misuse, interfere with, or attempt to
            gain unauthorized access to services or data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">3. Terms for Talent</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            <li>Talent may create and manage a portfolio to present skills and experience.</li>
            <li>Talent may request connections with businesses; businesses connect only after a Talent request.</li>
            <li>Talent is responsible for the accuracy of submitted information and portfolio content.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">4. Terms for Business</h2>
          <ul className="list-disc pl-5 text-gray-700 space-y-2">
            <li>Business profiles and job listings must be accurate and lawful.</li>
            <li>Businesses can review Talent profiles and respond to connection requests.</li>
            <li>Businesses must not attempt to identify Talent outside of permitted platform workflows.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">5. Content and Intellectual Property</h2>
          <p className="text-gray-700">
            You retain ownership of content you submit, but you grant Creerlio a license to host and
            display it for platform operations. Creerlio branding and platform content are protected
            by intellectual property laws.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">6. Privacy</h2>
          <p className="text-gray-700">
            We process personal data to provide the platform. By using Creerlio, you consent to our
            data handling practices as described in the Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">7. Disclaimers</h2>
          <p className="text-gray-700">
            Creerlio provides a platform for connections and does not guarantee employment, hiring
            outcomes, or the accuracy of third-party content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
          <p className="text-gray-700">
            To the extent permitted by law, Creerlio is not liable for indirect, incidental, or
            consequential damages arising from platform use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">9. Termination</h2>
          <p className="text-gray-700">
            We may suspend or terminate access for violations of these terms. You may close your
            account at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">10. Changes to Terms</h2>
          <p className="text-gray-700">
            We may update these terms. Continued use of the platform after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">11. Contact</h2>
          <p className="text-gray-700">
            For questions about these terms, contact us at 0432130169.
          </p>
        </section>
      </main>
    </div>
  )
}
