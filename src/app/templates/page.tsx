import Image from 'next/image'
import { Search, Sparkles, Type } from 'lucide-react'
import { UniSyncNav } from '@/components/UniSyncNav'

const templates = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    category: 'Modern',
    description: 'Clean lines and generous white space for a contemporary professional look.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBA-waqcRmRflpW5PvHc76xKDXFcvLPKRtJV57_zPzh5C7gQnqmYvu0n0Bcc6w65BhuXE2MHwTZDhRoGUw8eZuVcobVzrK_ryf8ulm9mkSeuGc6GQDr8rtwU9fbahIR6mqTb6G6rseljNTYrCVwTNAWDeTvfvjCLaSP5w7Q_9mDM0l-A3Q5NET6xp4tP-2EvFr2R6AQO2x8HvvM-l3wauDWnGdl3_HPdTFD9MSVGuV10griVmzOHLgxFkYDo8clcdKKQQPwZCC_-g',
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    category: 'Professional',
    description: 'Traditional gravitas with refined typographic hierarchy for senior roles.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBkFtBx6Ze4f8q1upJDq7wV2cOe3NA2oekiECPX3OZLmfEBP_Cx8xY5DeIWqQD6_rXk8BM5mV2tVFCcdXS5aWyyjhUp04a5xUDyVlMkbxOIQlCAagBKDB5D_LNwEMZsNsXPAIWZrx3EVljwK07EdFyjiiFJg-Y-za2GUNxgfs-p5ZSRtiBvgx7I3-YxyAWkkbrF5fYP9JprQTut-Oy8ZrVLxKv3xE3Y2Jysncv4vsyozo0Vfj-XJhlR4KDs4WEzyOtQpyNdM9UDKg',
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    category: 'Academic',
    description: 'Structured and comprehensive for academic and research positions.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSD5UP-Rprj-zJEKhRu9g6KM35Q9vnh36WH5k7cNVReZB3vQAd8cFcb3Cd5dtpXrcQhzHdxovrXH5pfdXemLpdONzqkv5R7iib6kmMlFkhbN49P9f4JqaK_K6Xjlj-FWFzWAjeBYAgJUZ3WWp0r_zV3cC5kybaXhY17RNlK8AmnHxjvxEn5AzxHiolzjSdVYGzIDFl6lYyqewma6NQ5ucYcD8KDi5veG8mb7zVpBs-LzA-V0BcQ1aezh1f82fRjoZXGyK6FhxGkg',
  },
]

const filterPills = ['All Templates', 'Creative', 'Professional', 'Modern', 'Academic']

export default function TemplatesPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#f9f9f9',
        color: '#2d3435',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      <UniSyncNav activePage="templates" />

      <main className="pt-20">
        <section className="bg-[#f9f9f9] px-6 py-24 text-center">
          <div className="mx-auto max-w-4xl">
            <p
              className="mb-6 text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#adb3b4' }}
            >
              Template Gallery
            </p>
            <h1
              className="mb-8 text-5xl leading-tight tracking-tight md:text-7xl"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              Pick your <span className="italic">canvas.</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed" style={{ color: '#5a6061' }}>
              Each template is precision-engineered in LaTeX for typographic excellence. Every
              layout, every margin, every line is intentional.
            </p>
          </div>
        </section>

        <section className="bg-[#f9f9f9] px-6 pb-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {filterPills.map((pill, i) => (
                <button
                  key={pill}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    i === 0
                      ? 'bg-[#2d3435] text-white'
                      : 'bg-[#ebeeef] text-[#5a6061] hover:bg-[#e4e9ea]'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#adb3b4' }}
              />
              <input
                type="text"
                placeholder="Search templates..."
                className="w-56 rounded-lg bg-[#ebeeef] py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:bg-[#e4e9ea]"
                style={{ color: '#2d3435' }}
              />
            </div>
          </div>
        </section>

        <section className="bg-[#f9f9f9] px-6 pb-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative overflow-hidden rounded-xl bg-white paper-shadow"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f2f4f4]">
                  <Image
                    src={template.image}
                    alt={`${template.name} template preview`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#2d3435]/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button className="w-40 rounded-lg bg-white px-8 py-3 text-center font-medium text-[#2d3435] transition-all hover:opacity-90">
                      Preview
                    </button>
                    <a
                      href="/dashboard/resumes"
                      className="w-40 rounded-lg border border-white/30 bg-[#2d3435] px-8 py-3 text-center font-medium text-white transition-all hover:bg-[#2d3435]/80"
                    >
                      Select
                    </a>
                  </div>
                  <div className="absolute left-4 top-4">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: 'rgba(249,249,249,0.9)', color: '#5a6061' }}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3
                    className="mb-2 text-2xl"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    {template.name}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#5a6061' }}>
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24" style={{ backgroundColor: '#f2f4f4' }}>
          <div className="mx-auto max-w-7xl pt-16">
            <div className="mb-10 flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: '#5a6061' }} />
              <h2 className="text-3xl" style={{ fontFamily: 'var(--font-newsreader), serif' }}>
                New &amp; Featured
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-white paper-shadow lg:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f9f9f9] to-[#e4e9ea]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-10">
                  <div>
                    <span
                      className="mb-6 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ backgroundColor: '#dde4e5', color: '#5a6061' }}
                    >
                      New in 2024
                    </span>
                    <h3
                      className="mb-4 text-4xl"
                      style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
                    >
                      The Editorial Architect 2024
                    </h3>
                    <p className="max-w-md text-base leading-relaxed" style={{ color: '#5a6061' }}>
                      Our most ambitious template yet. Asymmetric column layout, pull-quote
                      sections, and a curated typographic scale that reads like a magazine feature.
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-4">
                    <button className="rounded-lg bg-[#2d3435] px-6 py-3 font-medium text-white transition-all hover:opacity-90">
                      Preview Template
                    </button>
                    <button className="rounded-lg bg-[#ebeeef] px-6 py-3 font-medium text-[#2d3435] transition-all hover:bg-[#e4e9ea]">
                      Use This Template
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-col justify-between rounded-xl bg-[#2d3435] p-8 text-white"
                style={{ minHeight: 320 }}
              >
                <div>
                  <Type className="mb-5 h-6 w-6" style={{ color: '#adb3b4' }} />
                  <h3
                    className="mb-3 text-2xl"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    Custom Typesetting
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#adb3b4' }}>
                    Every template ships with fine-tuned kerning, leading, and optical margin
                    alignment, the hallmarks of professional print design applied to your career
                    document.
                  </p>
                </div>
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {['Kerning', 'Leading', 'Margins', 'Hierarchy'].map((item) => (
                      <div
                        key={item}
                        className="rounded-lg px-3 py-2 text-xs font-medium"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#d4dbdd' }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
