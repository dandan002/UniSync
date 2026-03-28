export default function ResumesPage() {
  return (
    <div
      className="min-h-screen px-8 py-12"
      style={{ backgroundColor: '#f9f9f9', color: '#2d3435', fontFamily: 'var(--font-inter), sans-serif' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: '#adb3b4' }}>
              Your Collection
            </p>
            <h1
              className="text-5xl leading-tight"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              My Gallery
            </h1>
            <p className="mt-3 text-base" style={{ color: '#5a6061' }}>
              Curate and manage your professional documents.
            </p>
          </div>
          <a
            href="/dashboard/resume/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2d3435] text-white font-medium rounded-lg hover:opacity-90 transition-all self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create New Resume
          </a>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Resume Card 1 */}
          <div className="group relative bg-white paper-shadow rounded-xl overflow-hidden cursor-pointer">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#f2f4f4]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzUmMVqG1WQyy5jxBrOqhwvynBPLzRi-V2dunW9rhB4tmLt-yaHrMgax5MxetsttjRtI8N2xflhR033_BQFfuQL490WW2DELzPJavXHDHTleEUE6BKsKNeBKlNS0OhnJRghnC6_hzwKyYx3eVB_fiBYzk2m-rr0eZVFgoxoSAZ72tKfJdlt2nWbQGUK6tz75b6v1pTcGd_CSebkg9ngovGjAEO6vR2MbT2PQGkAkLqNKQpU9e0fMPFdj0ssU-LIbPfClKdkZqaNQ"
                alt="Resume preview"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#2d3435]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <a
                  href="/dashboard/resume/1"
                  className="px-5 py-2.5 bg-white text-[#2d3435] font-medium text-sm rounded-lg hover:opacity-90 transition-all"
                >
                  Edit
                </a>
                <button className="px-5 py-2.5 bg-white/20 text-white font-medium text-sm rounded-lg border border-white/30 hover:bg-white/30 transition-all">
                  Download
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl mb-1"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    Senior Product Role
                  </h3>
                  <p className="text-xs" style={{ color: '#5a6061' }}>
                    Modern Minimalist template
                  </p>
                </div>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors"
                  style={{ color: '#5a6061' }}
                >
                  <span className="material-symbols-outlined text-base">more_horiz</span>
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ebeeef] rounded-full text-xs font-medium" style={{ color: '#2d3435' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d3435] inline-block" />
                  Active
                </span>
                <span className="text-xs" style={{ color: '#adb3b4' }}>Updated 2 days ago</span>
              </div>
            </div>
          </div>

          {/* Resume Card 2 */}
          <div className="group relative bg-white paper-shadow rounded-xl overflow-hidden cursor-pointer">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#f2f4f4]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-3hZX17Cp8_GQqQSDp-TvhWjW9enL-Bl0WiTg_9hkBGRKeBqViaGmUeCYfdNNzWlW8Md9OMm3T6Smh0JKynhrzjEAK8FBm4-dhfGBy6CKQMfk7Mj9H1wd8pDRVUteIaqkSdhom2lUHrQaogfhBfNYqHkidGX6KtG6F1l9otVK0Ebnm4OUdrfbqJTcdoc4bJE5rFrRqYMOcoLafg-kvbdG2QMS73M1tPhwUNjx4MOZ_CkvruVWTo1QhHP93h99sALeXoxqtg"
                alt="Resume preview"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#2d3435]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <a
                  href="/dashboard/resume/2"
                  className="px-5 py-2.5 bg-white text-[#2d3435] font-medium text-sm rounded-lg hover:opacity-90 transition-all"
                >
                  Edit
                </a>
                <button className="px-5 py-2.5 bg-white/20 text-white font-medium text-sm rounded-lg border border-white/30 hover:bg-white/30 transition-all">
                  Download
                </button>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl mb-1"
                    style={{ fontFamily: 'var(--font-newsreader), serif' }}
                  >
                    Design Director Application
                  </h3>
                  <p className="text-xs" style={{ color: '#5a6061' }}>
                    Executive Classic template
                  </p>
                </div>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f4f4] transition-colors"
                  style={{ color: '#5a6061' }}
                >
                  <span className="material-symbols-outlined text-base">more_horiz</span>
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ebeeef] rounded-full text-xs font-medium" style={{ color: '#757c7d' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#adb3b4] inline-block" />
                  Draft
                </span>
                <span className="text-xs" style={{ color: '#adb3b4' }}>Updated 1 week ago</span>
              </div>
            </div>
          </div>

          {/* New Concept Card */}
          <div className="group relative bg-[#f9f9f9] rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-[#adb3b4]/30 hover:border-[#2d3435]/30 transition-all flex flex-col items-center justify-center min-h-[380px] p-8">
            <div className="w-16 h-16 rounded-full bg-[#f2f4f4] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#e4e9ea] transition-all">
              <span className="material-symbols-outlined text-2xl" style={{ color: '#5a6061' }}>
                add
              </span>
            </div>
            <h3
              className="text-xl mb-2 text-center"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              New Concept
            </h3>
            <p className="text-sm text-center max-w-[180px]" style={{ color: '#adb3b4' }}>
              Start a fresh resume from your profile.
            </p>
          </div>
        </div>

        {/* Bottom Grid: Stats + Template Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Curation Insights */}
          <div className="lg:col-span-2 bg-white paper-shadow rounded-xl p-8">
            <div className="flex items-center gap-2 mb-8">
              <span className="material-symbols-outlined text-base" style={{ color: '#5a6061' }}>
                bar_chart
              </span>
              <h2
                className="text-2xl"
                style={{ fontFamily: 'var(--font-newsreader), serif' }}
              >
                Curation Insights
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: 'download', label: 'Downloads', value: '24', trend: '+8 this month' },
                { icon: 'location_city', label: 'Cities', value: '12', trend: 'Reached globally' },
                { icon: 'link', label: 'Active Links', value: '3', trend: 'Shared resumes' },
              ].map(({ icon, label, value, trend }) => (
                <div key={label} className="flex flex-col gap-2">
                  <div
                    className="w-10 h-10 rounded-lg bg-[#f2f4f4] flex items-center justify-center mb-1"
                    style={{ color: '#5a6061' }}
                  >
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                  </div>
                  <span
                    className="text-4xl font-medium"
                    style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
                  >
                    {value}
                  </span>
                  <span className="text-sm font-medium" style={{ color: '#2d3435' }}>{label}</span>
                  <span className="text-xs" style={{ color: '#adb3b4' }}>{trend}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Template Spotlight */}
          <div className="bg-[#2d3435] text-white rounded-xl overflow-hidden relative">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP017dDWJVnX2L32416SkeX2vzvw0jVGvhaKRsRiQJkdOqbM4mZYSGeZrgApIol1Ui7lkLS4L7pSuZgr_hNC5W54cS1H5eSZlbnQX4rzvl-S1cj8aS3Y8zBIQ4sKThGoJW_83uN7n39pemOhAHPkZYEaTilyTYSBHVwqR1HNURKKqc0eyh4cBkwyApfasxl2rsugvaL5_aTv5hqsadeK4HANfOqvwLS99SrqnZR2SAOzpTMyFFMU4zn0ClcFSKiotvE7KvSNpSeA"
              alt="Template spotlight"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="relative z-10 p-8 flex flex-col h-full justify-between" style={{ minHeight: 280 }}>
              <div>
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#d4dbdd' }}
                >
                  Template Spotlight
                </span>
                <h3
                  className="text-2xl mb-2"
                  style={{ fontFamily: 'var(--font-newsreader), serif' }}
                >
                  The Editorial Architect
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#adb3b4' }}>
                  A refined asymmetric layout for creative directors and design leaders.
                </p>
              </div>
              <a
                href="/templates"
                className="inline-flex items-center gap-2 text-sm font-medium mt-6 hover:opacity-80 transition-opacity"
                style={{ color: '#dde4e5' }}
              >
                Browse Templates
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
