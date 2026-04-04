import Link from 'next/link'
import { ArrowRight, FileUp, PenLine, Sparkles, Sigma, LayoutDashboard, Signature } from 'lucide-react'
import { UniSyncNav } from '@/components/UniSyncNav'

const featureItems = [
  {
    icon: Sigma,
    title: 'LaTeX Precision',
    desc: "Every document is compiled with academic-grade LaTeX, ensuring perfect alignment and professional typeset which standard builders can't match.",
  },
  {
    icon: LayoutDashboard,
    title: 'Asymmetric Templates',
    desc: 'Choose from a library of layouts designed by world-class editorial architects. Intentional white space and refined typography are built-in.',
  },
  {
    icon: Signature,
    title: 'AI Narrative Tuning',
    desc: "Our AI doesn't just check grammar; it refines your professional narrative to highlight impact and leadership using action-oriented language.",
  },
]

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
        <section
          style={{
            minHeight: 870,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="bg-[#f9f9f9] px-6 py-20"
        >
          <div className="mb-16 w-full max-w-4xl text-center">
            <h1
              className="mb-8 text-5xl leading-tight tracking-tight md:text-7xl"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              Transform your experience into a{' '}
              <span className="italic">professional gallery.</span>
            </h1>
            <p
              className="mx-auto max-w-2xl text-lg leading-relaxed md:text-xl"
              style={{ color: '#5a6061' }}
            >
              Move beyond the template. UniSync treats your career as a high-end editorial,
              powered by AI and precision LaTeX.
            </p>
          </div>

          <div className="grid w-full max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-12">
            <Link
              href="/onboarding?step=2"
              className="group min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#adb3b4]/20 bg-white p-8 paper-shadow transition-all hover:border-[#2d3435]/40 md:col-span-8 flex"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f2f4f4] transition-transform group-hover:scale-110">
                <FileUp className="h-10 w-10 text-[#2d3435]" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Drop your existing resume</h3>
              <p className="mb-8 max-w-xs text-center text-sm" style={{ color: '#5a6061' }}>
                We&apos;ll extract your history and re-style it instantly. Supports PDF, DOCX, and TXT.
              </p>
              <span className="rounded-lg bg-[#2d3435] px-8 py-3 font-medium text-white shadow-lg transition-all hover:opacity-90">
                Choose File
              </span>
            </Link>

            <div className="flex flex-col gap-6 md:col-span-4">
              <Link
                href="/sign-up"
                className="group flex-1 cursor-pointer rounded-xl bg-[#f2f4f4] p-8 transition-colors hover:bg-[#e4e9ea] flex flex-col justify-between"
              >
                <div>
                  <PenLine className="mb-4 h-6 w-6 text-[#5a6061]" />
                  <h4 className="mb-2 text-lg font-medium">Start from scratch</h4>
                  <p className="text-sm leading-snug" style={{ color: '#5a6061' }}>
                    Begin with a blank canvas and our guided AI builder.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-sm font-semibold" style={{ color: '#2d3435' }}>
                  Launch Editor
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
              <div className="rounded-xl bg-[#2d3435] p-8 text-white">
                <Sparkles className="mb-4 h-6 w-6 text-[#adb3b4]" />
                <h4 className="mb-2 text-lg font-medium">AI LaTeX Engine</h4>
                <p className="text-sm leading-snug" style={{ color: '#d4dbdd' }}>
                  Perfectly kerned, production-ready typography for the modern professional.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden px-6 py-32" style={{ backgroundColor: '#f2f4f4' }}>
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-20 lg:grid-cols-2">
            <div className="relative order-2 lg:order-1">
              <div
                className="paper-shadow relative z-10 mx-auto aspect-[1/1.41] max-w-lg bg-white p-12 md:p-16"
                style={{ maxWidth: 480 }}
              >
                <div className="mb-12 pb-8" style={{ borderBottom: '1px solid rgba(45,52,53,0.05)' }}>
                  <h2
                    className="mb-2 text-4xl"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    Julianne Sterling
                  </h2>
                  <p
                    className="text-xs uppercase tracking-widest"
                    style={{ color: '#5a6061', fontFamily: 'var(--font-inter), sans-serif' }}
                  >
                    Senior Design Architect
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3
                      className="border-b border-[rgba(45,52,53,0.05)] pb-1 text-lg italic"
                      style={{ fontFamily: 'var(--font-newsreader), serif' }}
                    >
                      Experience
                    </h3>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">Editorial Lead @ Studio V</span>
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
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium">Senior Designer @ Flux Agency</span>
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
                className="absolute -left-10 -top-10 h-64 w-64 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(45,52,53,0.05)' }}
              />
              <div
                className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(45,52,53,0.05)' }}
              />
            </div>

            <div className="order-1 space-y-12 lg:order-2">
              <div
                className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
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
                {featureItems.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-6">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white"
                      style={{ color: '#2d3435' }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="mb-2 text-lg font-medium">{title}</h4>
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

        <section className="bg-[#f9f9f9] px-6 py-24 text-center">
          <div className="group relative mx-auto max-w-3xl overflow-hidden rounded-2xl bg-[#f2f4f4] p-16">
            <div className="relative z-10">
              <h2
                className="mb-6 text-4xl"
                style={{ fontFamily: 'var(--font-newsreader), serif' }}
              >
                Ready to curate your story?
              </h2>
              <p className="mb-10 text-lg" style={{ color: '#5a6061' }}>
                Join professionals who trust UniSync for their next big move.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-[#2d3435] px-10 py-4 font-semibold text-[#f9f9f9] transition-all hover:opacity-90"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/templates"
                  className="rounded-lg bg-[#dde4e5] px-10 py-4 font-semibold text-[#2d3435] transition-all hover:opacity-80"
                >
                  View Templates
                </Link>
              </div>
            </div>
            <div
              className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors group-hover:opacity-100"
              style={{ backgroundColor: 'rgba(45,52,53,0.05)' }}
            />
          </div>
        </section>
      </main>

      <footer
        className="w-full bg-[#f9f9f9] py-16"
        style={{ borderTop: '1px solid rgba(173,179,180,0.15)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-12 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <span
              className="text-xl italic"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              UniSync
            </span>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#adb3b4' }}
            >
              2025 UniSync. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            {['Privacy', 'Terms', 'API', 'Careers'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs font-semibold uppercase tracking-widest transition-all hover:text-[#2d3435]"
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
