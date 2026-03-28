import { UniSyncNav } from '@/components/UniSyncNav'

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#f9f9f9',
        color: '#2d3435',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      <UniSyncNav />

      <main className="pt-20">
        {/* Hero & Upload Section */}
        <section
          style={{
            minHeight: 870,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="px-6 py-20 bg-[#f9f9f9]"
        >
          <div className="max-w-4xl w-full text-center mb-16">
            <h1
              className="text-5xl md:text-7xl leading-tight tracking-tight mb-8"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              Transform your experience into a{' '}
              <span className="italic">professional gallery.</span>
            </h1>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: '#5a6061' }}
            >
              Move beyond the template. UniSync treats your career as a high-end editorial,
              powered by AI and precision LaTeX.
            </p>
          </div>

          {/* Upload Bento Grid */}
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 px-4">
            {/* Main Upload Card */}
            <div className="md:col-span-8 bg-white paper-shadow rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-[#adb3b4]/20 hover:border-[#2d3435]/40 transition-all group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-[#f2f4f4] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl" style={{ color: '#2d3435' }}>
                  upload_file
                </span>
              </div>
              <h3 className="text-xl font-medium mb-2">Drop your existing resume</h3>
              <p className="text-sm mb-8 text-center max-w-xs" style={{ color: '#5a6061' }}>
                We&apos;ll extract your history and re-style it instantly. Supports PDF, DOCX, and TXT.
              </p>
              <button className="px-8 py-3 bg-[#2d3435] text-white font-medium rounded-lg shadow-lg hover:opacity-90 transition-all">
                Choose File
              </button>
            </div>

            {/* Side Actions */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="flex-1 bg-[#f2f4f4] rounded-xl p-8 flex flex-col justify-between hover:bg-[#e4e9ea] transition-colors cursor-pointer group">
                <div>
                  <span className="material-symbols-outlined mb-4 block" style={{ color: '#5a6061' }}>
                    edit_note
                  </span>
                  <h4 className="text-lg font-medium mb-2">Start from scratch</h4>
                  <p className="text-sm leading-snug" style={{ color: '#5a6061' }}>
                    Begin with a blank canvas and our guided AI builder.
                  </p>
                </div>
                <div
                  className="flex items-center font-semibold text-sm mt-4"
                  style={{ color: '#2d3435' }}
                >
                  Launch Editor
                  <span className="material-symbols-outlined text-sm ml-1 group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
              <div className="bg-[#2d3435] text-white rounded-xl p-8">
                <span className="material-symbols-outlined mb-4 block" style={{ color: '#adb3b4' }}>
                  auto_awesome
                </span>
                <h4 className="text-lg font-medium mb-2">AI LaTeX Engine</h4>
                <p className="text-sm leading-snug" style={{ color: '#d4dbdd' }}>
                  Perfectly kerned, production-ready typography for the modern professional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="py-32 px-6 overflow-hidden" style={{ backgroundColor: '#f2f4f4' }}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              {/* Paper Component */}
              <div
                className="bg-white p-12 md:p-16 paper-shadow aspect-[1/1.41] max-w-lg mx-auto relative z-10"
                style={{ maxWidth: 480 }}
              >
                <div className="mb-12 pb-8" style={{ borderBottom: '1px solid rgba(45,52,53,0.05)' }}>
                  <h2
                    className="text-4xl mb-2"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    Julianne Sterling
                  </h2>
                  <p
                    className="text-xs tracking-widest uppercase"
                    style={{ color: '#5a6061', fontFamily: 'var(--font-inter), sans-serif' }}
                  >
                    Senior Design Architect
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3
                      className="text-lg italic pb-1"
                      style={{
                        fontFamily: 'var(--font-newsreader), serif',
                        borderBottom: '1px solid rgba(45,52,53,0.05)',
                      }}
                    >
                      Experience
                    </h3>
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-sm">Editorial Lead @ Studio V</span>
                      <span className="text-xs italic" style={{ color: '#5a6061' }}>
                        2020 — Present
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#5a6061' }}>
                      Pioneered the &apos;Digital Curator&apos; methodology, leading to a 40% increase in user
                      retention.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-sm">Senior Designer @ Flux Agency</span>
                      <span className="text-xs italic" style={{ color: '#5a6061' }}>
                        2017 — 2020
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#5a6061' }}>
                      Designed and implemented complex design systems for Fortune 500 clients.
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="absolute -top-10 -left-10 w-64 h-64 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(45,52,53,0.05)' }}
              />
              <div
                className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(45,52,53,0.05)' }}
              />
            </div>

            <div className="order-1 lg:order-2 space-y-12">
              <div
                className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                style={{ backgroundColor: '#dde4e5', color: '#5a6061' }}
              >
                Sophisticated Output
              </div>
              <h2
                className="text-5xl leading-tight"
                style={{ fontFamily: 'var(--font-newsreader), serif' }}
              >
                Beyond the standard <span className="italic">document.</span>
              </h2>
              <div className="space-y-10">
                {[
                  {
                    icon: 'functions',
                    title: 'LaTeX Precision',
                    desc: "Every document is compiled with academic-grade LaTeX, ensuring perfect alignment and professional typeset which standard builders can't match.",
                  },
                  {
                    icon: 'dashboard_customize',
                    title: 'Asymmetric Templates',
                    desc: 'Choose from a library of layouts designed by world-class editorial architects. Intentional white space and refined typography are built-in.',
                  },
                  {
                    icon: 'history_edu',
                    title: 'AI Narrative Tuning',
                    desc: "Our AI doesn't just check grammar; it refines your professional narrative to highlight impact and leadership using action-oriented language.",
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-6">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-lg bg-white flex items-center justify-center"
                      style={{ color: '#2d3435' }}
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-2">{title}</h4>
                      <p className="leading-relaxed" style={{ color: '#5a6061' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 text-center bg-[#f9f9f9]">
          <div className="max-w-3xl mx-auto bg-[#f2f4f4] p-16 rounded-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <h2
                className="text-4xl mb-6"
                style={{ fontFamily: 'var(--font-newsreader), serif' }}
              >
                Ready to curate your story?
              </h2>
              <p className="mb-10 text-lg" style={{ color: '#5a6061' }}>
                Join professionals who trust UniSync for their next big move.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/sign-up"
                  className="px-10 py-4 bg-[#2d3435] text-[#f9f9f9] font-semibold rounded-lg hover:opacity-90 transition-all"
                >
                  Get Started Free
                </a>
                <a
                  href="/templates"
                  className="px-10 py-4 bg-[#dde4e5] text-[#2d3435] font-semibold rounded-lg hover:opacity-80 transition-all"
                >
                  View Templates
                </a>
              </div>
            </div>
            <div
              className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 rounded-full blur-3xl group-hover:opacity-100 transition-colors"
              style={{ backgroundColor: 'rgba(45,52,53,0.05)' }}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="w-full py-16 bg-[#f9f9f9]"
        style={{ borderTop: '1px solid rgba(173,179,180,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span
              className="text-xl italic"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              UniSync
            </span>
            <p
              className="text-xs tracking-widest uppercase font-semibold"
              style={{ color: '#adb3b4' }}
            >
              © 2025 UniSync. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            {['Privacy', 'Terms', 'API', 'Careers'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs tracking-widest uppercase font-semibold transition-all hover:text-[#2d3435]"
                style={{ color: '#adb3b4' }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
