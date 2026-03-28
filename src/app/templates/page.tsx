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
        {/* Hero */}
        <section className="px-6 py-24 text-center bg-[#f9f9f9]">
          <div className="max-w-4xl mx-auto">
            <p
              className="text-xs tracking-widest uppercase font-semibold mb-6"
              style={{ color: '#adb3b4' }}
            >
              Template Gallery
            </p>
            <h1
              className="text-5xl md:text-7xl leading-tight tracking-tight mb-8"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              Pick your <span className="italic">canvas.</span>
            </h1>
            <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: '#5a6061' }}>
              Each template is precision-engineered in LaTeX for typographic excellence. Every
              layout, every margin, every line — intentional.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="px-6 pb-10 bg-[#f9f9f9]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filterPills.map((pill, i) => (
                <button
                  key={pill}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
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
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base"
                style={{ color: '#adb3b4' }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search templates..."
                className="pl-10 pr-4 py-2 bg-[#ebeeef] rounded-lg text-sm outline-none focus:bg-[#e4e9ea] transition-colors w-56"
                style={{ color: '#2d3435' }}
              />
            </div>
          </div>
        </section>

        {/* Template Grid */}
        <section className="px-6 pb-24 bg-[#f9f9f9]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => (
              <div key={template.id} className="group relative bg-white paper-shadow rounded-xl overflow-hidden">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f2f4f4]">
                  <img
                    src={template.image}
                    alt={`${template.name} template preview`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover reveal */}
                  <div className="absolute inset-0 bg-[#2d3435]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                    <button className="px-8 py-3 bg-white text-[#2d3435] font-medium rounded-lg hover:opacity-90 transition-all w-40 text-center">
                      Preview
                    </button>
                    <a
                      href="/dashboard/resumes"
                      className="px-8 py-3 bg-[#2d3435] text-white font-medium rounded-lg border border-white/30 hover:bg-[#2d3435]/80 transition-all w-40 text-center"
                    >
                      Select
                    </a>
                  </div>
                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                      style={{ backgroundColor: 'rgba(249,249,249,0.9)', color: '#5a6061' }}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3
                    className="text-2xl mb-2"
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

        {/* Featured Section */}
        <section className="px-6 pb-24" style={{ backgroundColor: '#f2f4f4' }}>
          <div className="max-w-7xl mx-auto pt-16">
            <div className="flex items-center gap-2 mb-10">
              <span
                className="material-symbols-outlined text-base"
                style={{ color: '#5a6061' }}
              >
                auto_awesome
              </span>
              <h2
                className="text-3xl"
                style={{ fontFamily: 'var(--font-newsreader), serif' }}
              >
                New &amp; Featured
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Editorial Architect Bento */}
              <div className="lg:col-span-2 bg-white paper-shadow rounded-xl overflow-hidden relative min-h-[320px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f9f9f9] to-[#e4e9ea]" />
                <div className="relative z-10 p-10 flex flex-col justify-between h-full">
                  <div>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6"
                      style={{ backgroundColor: '#dde4e5', color: '#5a6061' }}
                    >
                      New in 2024
                    </span>
                    <h3
                      className="text-4xl mb-4"
                      style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
                    >
                      The Editorial Architect 2024
                    </h3>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: '#5a6061' }}>
                      Our most ambitious template yet. Asymmetric column layout, pull-quote
                      sections, and a curated typographic scale that reads like a magazine feature.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-8">
                    <button className="px-6 py-3 bg-[#2d3435] text-white font-medium rounded-lg hover:opacity-90 transition-all">
                      Preview Template
                    </button>
                    <button className="px-6 py-3 bg-[#ebeeef] text-[#2d3435] font-medium rounded-lg hover:bg-[#e4e9ea] transition-all">
                      Use This Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Typesetting Card */}
              <div
                className="bg-[#2d3435] text-white rounded-xl p-8 flex flex-col justify-between"
                style={{ minHeight: 320 }}
              >
                <div>
                  <span
                    className="material-symbols-outlined mb-5 block text-2xl"
                    style={{ color: '#adb3b4' }}
                  >
                    text_format
                  </span>
                  <h3
                    className="text-2xl mb-3"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    Custom Typesetting
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#adb3b4' }}>
                    Every template ships with fine-tuned kerning, leading, and optical margin
                    alignment — the hallmarks of professional print design, applied to your career
                    document.
                  </p>
                </div>
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {['Kerning', 'Leading', 'Margins', 'Hierarchy'].map((item) => (
                      <div
                        key={item}
                        className="px-3 py-2 rounded-lg text-xs font-medium"
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
