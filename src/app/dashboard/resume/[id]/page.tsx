'use client'

import { useState, useCallback } from 'react'

interface Experience {
  id: string
  title: string
  company: string
  period: string
  bullets: string
}

const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: '1',
    title: 'Editorial Lead',
    company: 'Studio V',
    period: '2020 — Present',
    bullets:
      "Pioneered the 'Digital Curator' methodology, leading to a 40% increase in user retention.\nManaged a cross-functional team of 8 designers and content strategists.",
  },
  {
    id: '2',
    title: 'Senior Designer',
    company: 'Flux Agency',
    period: '2017 — 2020',
    bullets:
      'Designed and implemented complex design systems for Fortune 500 clients.\nDelivered 12 end-to-end brand identities across fintech and healthcare verticals.',
  },
]

const INITIAL_SKILLS = [
  'Design Systems',
  'LaTeX',
  'Typography',
  'Brand Strategy',
  'AI Tools',
  'Leadership',
]

export default function ResumeEditorPage() {
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [fullName, setFullName] = useState('Julianne Sterling')
  const [title, setTitle] = useState('Senior Design Architect')
  const [email, setEmail] = useState('julianne@studiowork.co')
  const [location, setLocation] = useState('New York, NY')
  const [website, setWebsite] = useState('juliannestealing.com')
  const [narrative, setNarrative] = useState(
    "A design leader with over a decade of experience shaping the visual language of forward-thinking brands. I specialize in building design systems that scale and editorial frameworks that tell a story. My work sits at the intersection of precision craft and strategic thinking — always asking not just 'how does it look?' but 'what does it mean?'"
  )
  const [experiences, setExperiences] = useState<Experience[]>(INITIAL_EXPERIENCES)
  const [skills, setSkills] = useState<string[]>(INITIAL_SKILLS)
  const [newSkill, setNewSkill] = useState('')

  const triggerAutoSave = useCallback(() => {
    setAutoSaveStatus('saving')
    setTimeout(() => setAutoSaveStatus('saved'), 1200)
  }, [])

  const handleFieldChange = useCallback(
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value)
      setAutoSaveStatus('unsaved')
      triggerAutoSave()
    },
    [triggerAutoSave]
  )

  const handleExperienceChange = useCallback(
    (id: string, field: keyof Experience, value: string) => {
      setExperiences((prev) =>
        prev.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
      )
      setAutoSaveStatus('unsaved')
      triggerAutoSave()
    },
    [triggerAutoSave]
  )

  const addSkill = useCallback(() => {
    const trimmed = newSkill.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed])
      setNewSkill('')
      triggerAutoSave()
    }
  }, [newSkill, skills, triggerAutoSave])

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
    triggerAutoSave()
  }, [triggerAutoSave])

  const ghostInputClass =
    'w-full bg-transparent outline-none text-[#2d3435] border-b border-[rgba(173,179,180,0.15)] focus:border-[rgba(45,52,53,0.3)] transition-colors pb-1.5 text-sm'

  return (
    <div
      className="flex"
      style={{
        height: 'calc(100vh - 80px)',
        backgroundColor: '#f9f9f9',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {/* ── Left Panel: Editor ──────────────────────────────────────────── */}
      <div
        className="w-1/2 flex flex-col overflow-hidden"
        style={{ borderRight: '1px solid rgba(173,179,180,0.15)' }}
      >
        {/* Editor Toolbar */}
        <div
          className="flex items-center justify-between px-8 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(173,179,180,0.15)', backgroundColor: '#f9f9f9' }}
        >
          <div className="flex items-center gap-3">
            <h1
              className="text-xl italic"
              style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
            >
              Resume Editor
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#adb3b4' }}>
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${
                autoSaveStatus === 'saved'
                  ? 'bg-green-400'
                  : autoSaveStatus === 'saving'
                  ? 'bg-amber-400'
                  : 'bg-[#adb3b4]'
              }`}
            />
            {autoSaveStatus === 'saved'
              ? 'All changes saved'
              : autoSaveStatus === 'saving'
              ? 'Saving...'
              : 'Unsaved changes'}
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-8 py-8 space-y-10">
          {/* Personal Identity */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-base" style={{ color: '#adb3b4' }}>
                person
              </span>
              <h2 className="text-xs tracking-widest uppercase font-semibold" style={{ color: '#adb3b4' }}>
                Personal Identity
              </h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={handleFieldChange(setFullName)}
                  className={ghostInputClass}
                  style={{ fontSize: '1.1rem', fontWeight: 500 }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                  Professional Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={handleFieldChange(setTitle)}
                  className={ghostInputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleFieldChange(setEmail)}
                    className={ghostInputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={handleFieldChange(setLocation)}
                    className={ghostInputClass}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                  Website / Portfolio
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={handleFieldChange(setWebsite)}
                  className={ghostInputClass}
                />
              </div>
            </div>
          </div>

          {/* Professional Narrative */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: '#adb3b4' }}>
                  history_edu
                </span>
                <h2 className="text-xs tracking-widest uppercase font-semibold" style={{ color: '#adb3b4' }}>
                  Professional Narrative
                </h2>
              </div>
              <button
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#5a6061', backgroundColor: '#ebeeef' }}
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Rewrite with AI
              </button>
            </div>
            <textarea
              value={narrative}
              onChange={handleFieldChange(setNarrative)}
              rows={5}
              className="w-full bg-transparent outline-none text-sm leading-relaxed resize-none text-[#2d3435]"
              style={{ borderBottom: '1px solid rgba(173,179,180,0.15)' }}
            />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: '#adb3b4' }}>
                  work
                </span>
                <h2 className="text-xs tracking-widest uppercase font-semibold" style={{ color: '#adb3b4' }}>
                  Experience
                </h2>
              </div>
              <button
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: '#5a6061' }}
                onClick={() =>
                  setExperiences((prev) => [
                    ...prev,
                    { id: String(Date.now()), title: '', company: '', period: '', bullets: '' },
                  ])
                }
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Role
              </button>
            </div>
            <div className="space-y-8">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="space-y-3 pb-8"
                  style={{ borderBottom: '1px solid rgba(173,179,180,0.1)' }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)}
                        className={ghostInputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                        Company
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                        className={ghostInputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: '#5a6061' }}>
                      Period
                    </label>
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => handleExperienceChange(exp.id, 'period', e.target.value)}
                      className={ghostInputClass}
                      placeholder="2020 — Present"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium" style={{ color: '#5a6061' }}>
                        Achievements
                      </label>
                      <button
                        className="flex items-center gap-1 text-xs"
                        style={{ color: '#adb3b4' }}
                      >
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        AI Optimize
                      </button>
                    </div>
                    <textarea
                      value={exp.bullets}
                      onChange={(e) => handleExperienceChange(exp.id, 'bullets', e.target.value)}
                      rows={3}
                      className="w-full bg-transparent outline-none text-sm leading-relaxed resize-none text-[#2d3435]"
                      style={{ borderBottom: '1px solid rgba(173,179,180,0.15)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-base" style={{ color: '#adb3b4' }}>
                psychology
              </span>
              <h2 className="text-xs tracking-widest uppercase font-semibold" style={{ color: '#adb3b4' }}>
                Skills &amp; Expertise
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: '#ebeeef', color: '#2d3435' }}
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[#dde4e5] transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill..."
                className={`${ghostInputClass} flex-1`}
              />
              <button
                onClick={addSkill}
                className="px-3 py-1.5 bg-[#ebeeef] rounded-lg text-sm font-medium hover:bg-[#e4e9ea] transition-colors"
                style={{ color: '#5a6061' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Preview ─────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col overflow-hidden bg-[#ebeeef]">
        {/* Preview Toolbar (glassmorphic) */}
        <div
          className="flex items-center justify-between px-8 py-4 flex-shrink-0 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(235,238,239,0.8)',
            borderBottom: '1px solid rgba(173,179,180,0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: '#5a6061' }}>
              preview
            </span>
            <span className="text-sm font-medium" style={{ color: '#5a6061' }}>
              Live Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: '#f2f4f4', color: '#5a6061' }}
            >
              <span className="material-symbols-outlined text-sm">dashboard_customize</span>
              Change Template
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: '#f2f4f4', color: '#5a6061' }}
            >
              <span className="material-symbols-outlined text-sm">functions</span>
              LaTeX
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2d3435] text-white hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download PDF
            </button>
          </div>
        </div>

        {/* Paper Preview */}
        <div className="flex-1 overflow-y-auto hide-scrollbar flex items-start justify-center p-10">
          <div
            className="bg-white paper-shadow w-full max-w-lg"
            style={{ minHeight: 700, padding: '48px 52px' }}
          >
            {/* Resume Header */}
            <div className="mb-10 pb-8" style={{ borderBottom: '1px solid rgba(45,52,53,0.06)' }}>
              <h2
                className="text-4xl mb-1"
                style={{ fontFamily: 'var(--font-newsreader), serif', color: '#2d3435' }}
              >
                {fullName || 'Your Name'}
              </h2>
              <p
                className="text-xs tracking-widest uppercase mb-3"
                style={{ color: '#5a6061' }}
              >
                {title || 'Your Title'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {email && (
                  <span className="text-xs" style={{ color: '#757c7d' }}>
                    {email}
                  </span>
                )}
                {location && (
                  <span className="text-xs" style={{ color: '#757c7d' }}>
                    {location}
                  </span>
                )}
                {website && (
                  <span className="text-xs" style={{ color: '#757c7d' }}>
                    {website}
                  </span>
                )}
              </div>
            </div>

            {/* Narrative */}
            {narrative && (
              <div className="mb-8">
                <h3
                  className="text-base italic mb-3 pb-1"
                  style={{
                    fontFamily: 'var(--font-newsreader), serif',
                    borderBottom: '1px solid rgba(45,52,53,0.05)',
                    color: '#2d3435',
                  }}
                >
                  Profile
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5a6061' }}>
                  {narrative}
                </p>
              </div>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <div className="mb-8">
                <h3
                  className="text-base italic mb-4 pb-1"
                  style={{
                    fontFamily: 'var(--font-newsreader), serif',
                    borderBottom: '1px solid rgba(45,52,53,0.05)',
                    color: '#2d3435',
                  }}
                >
                  Experience
                </h3>
                <div className="space-y-5">
                  {experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium text-xs" style={{ color: '#2d3435' }}>
                          {exp.title}{exp.company ? ` @ ${exp.company}` : ''}
                        </span>
                        <span className="text-xs italic" style={{ color: '#5a6061' }}>
                          {exp.period}
                        </span>
                      </div>
                      {exp.bullets && (
                        <div className="space-y-1 mt-1.5">
                          {exp.bullets.split('\n').filter(Boolean).map((bullet, i) => (
                            <p key={i} className="text-xs leading-relaxed" style={{ color: '#5a6061' }}>
                              — {bullet}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h3
                  className="text-base italic mb-3 pb-1"
                  style={{
                    fontFamily: 'var(--font-newsreader), serif',
                    borderBottom: '1px solid rgba(45,52,53,0.05)',
                    color: '#2d3435',
                  }}
                >
                  Skills
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5a6061' }}>
                  {skills.join(' · ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
