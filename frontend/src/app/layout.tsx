import './globals.css';

export const metadata = {
  title: 'Creerlio',
  description: 'AI-powered Talent & Business Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='bg-slate-950 text-white'>

        <header className='sticky top-0 z-50 backdrop-blur bg-slate-950/80 border-b border-white/10'>
          <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>

            {/* Logo */}
            <div className='text-xl font-bold tracking-tight'>
              Creerlio
            </div>

            {/* Navigation */}
            <nav>
              <ul className='flex items-center space-x-8 text-sm text-slate-300'>
                <li><a href='#about' className='hover:text-white'>About</a></li>
                <li><a href='#talent' className='hover:text-white'>Talent</a></li>
                <li><a href='#business' className='hover:text-white'>Business</a></li>
                <li><a href='#analytics' className='hover:text-white'>Analytics</a></li>
                <li><a href='#search' className='hover:text-white'>Search</a></li>
              </ul>
            </nav>

            {/* CTA */}
            <div>
              <a
                href='/register'
                className='px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition font-medium'
              >
                Free Trial
              </a>
            </div>

          </div>
        </header>

        <main className='max-w-7xl mx-auto'>
          {children}
        </main>

      </body>
    </html>
  );
}
