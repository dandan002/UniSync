'use client'

import { buildResumePreviewHeader, buildResumePreviewSections, getResumeTemplate } from '@/lib/resume'
import type { ProfileFormData } from '@/lib/schemas'
import type { ResumePreviewListItem, ResumeSectionConfig } from '@/lib/types'

interface Props {
  resumeName: string
  templateId: string
  sections: ResumeSectionConfig[]
  profile: Partial<ProfileFormData & { name: string }>
}

function PreviewList({ items, compact = false }: { items: ResumePreviewListItem[]; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {items.map((item, index) => (
        <article key={`${item.title}-${index}`} className="space-y-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h4 className={compact ? 'text-[13px] font-semibold' : 'text-sm font-semibold'}>
                {item.title}
              </h4>
              {item.subtitle && (
                <p className={compact ? 'text-[11px] text-[#5a6061]' : 'text-xs text-[#5a6061]'}>
                  {item.subtitle}
                </p>
              )}
            </div>
            {item.meta && (
              <p className={compact ? 'text-[10px] uppercase tracking-[0.2em] text-[#757c7d]' : 'text-[11px] uppercase tracking-[0.18em] text-[#757c7d]'}>
                {item.meta}
              </p>
            )}
          </div>
          {item.bullets && item.bullets.length > 0 && (
            <ul className={compact ? 'space-y-1 pl-4 text-[11px] text-[#2d3435]' : 'space-y-1 pl-4 text-xs text-[#2d3435]'}>
              {item.bullets.map((bullet, bulletIndex) => (
                <li key={`${bullet}-${bulletIndex}`} className="list-disc">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  )
}

function PreviewTags({ items, subtle = false }: { items: string[]; subtle?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-2.5 py-1 text-[11px] ${
            subtle
              ? 'border-[#dde4e5] bg-[#f2f4f4] text-[#5a6061]'
              : 'border-[#2d3435]/15 bg-[#f9f9f9] text-[#2d3435]'
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function renderSectionBody(
  section: ReturnType<typeof buildResumePreviewSections>[number],
  variant: 'modern' | 'executive' | 'academic'
) {
  if (section.kind === 'text') {
    return (
      <p
        className={`leading-relaxed ${
          variant === 'academic' ? 'text-[12px]' : 'text-sm'
        } ${section.isPlaceholder ? 'italic text-[#757c7d]' : 'text-[#2d3435]'}`}
      >
        {section.content as string}
      </p>
    )
  }

  if (section.kind === 'list') {
    return (
      <PreviewList
        items={section.content as ResumePreviewListItem[]}
        compact={variant === 'academic'}
      />
    )
  }

  return <PreviewTags items={section.content as string[]} subtle={variant === 'academic'} />
}

function ModernPreview({
  header,
  sections,
}: {
  header: ReturnType<typeof buildResumePreviewHeader>
  sections: ReturnType<typeof buildResumePreviewSections>
}) {
  return (
    <div className="rounded-[28px] border border-[#dde4e5] bg-white p-6 paper-shadow sm:p-8">
      <header className="border-b border-[#dde4e5] pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#757c7d]">
          Modern Minimalist
        </p>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#2d3435]">
          {header.name}
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5a6061]">
          <span>{header.headline}</span>
          <span className="text-[#adb3b4]">/</span>
          <span>{header.location}</span>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#757c7d]">
                {section.label}
              </h4>
              <div className="h-px flex-1 bg-[#dde4e5]" />
            </div>
            {renderSectionBody(section, 'modern')}
          </section>
        ))}
      </div>
    </div>
  )
}

function ExecutivePreview({
  header,
  sections,
}: {
  header: ReturnType<typeof buildResumePreviewHeader>
  sections: ReturnType<typeof buildResumePreviewSections>
}) {
  return (
    <div className="rounded-[28px] border border-[#d4dbdd] bg-[#fffdfa] p-6 paper-shadow sm:p-8">
      <header className="rounded-[20px] border border-[#dde4e5] bg-[#f9f9f9] px-5 py-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#757c7d]">
          Executive Classic
        </p>
        <h3
          className="mt-3 text-4xl text-[#2d3435]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {header.name}
        </h3>
        <p className="mt-3 text-sm text-[#5a6061]">{header.headline}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[#757c7d]">
          {header.location}
        </p>
      </header>

      <div className="mt-6 space-y-5">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            <h4
              className="border-b border-[#d4dbdd] pb-2 text-lg text-[#2d3435]"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {section.label}
            </h4>
            {renderSectionBody(section, 'executive')}
          </section>
        ))}
      </div>
    </div>
  )
}

function AcademicPreview({
  header,
  sections,
}: {
  header: ReturnType<typeof buildResumePreviewHeader>
  sections: ReturnType<typeof buildResumePreviewSections>
}) {
  const primarySections = sections.filter((section) => section.id !== 'skills')
  const sideSections = sections.filter((section) => section.id === 'skills')

  return (
    <div className="rounded-[28px] border border-[#dde4e5] bg-white p-6 paper-shadow sm:p-8">
      <header className="border-b border-[#2d3435] pb-4">
        <h3
          className="text-3xl text-[#2d3435]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {header.name}
        </h3>
        <p className="mt-2 text-sm text-[#5a6061]">{header.headline}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#757c7d]">
          {header.location}
        </p>
      </header>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_140px]">
        <div className="space-y-5">
          {primarySections.map((section) => (
            <section key={section.id} className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2d3435]">
                {section.label}
              </h4>
              {renderSectionBody(section, 'academic')}
            </section>
          ))}
        </div>

        {sideSections.length > 0 && (
          <aside className="space-y-4 border-t border-[#dde4e5] pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            {sideSections.map((section) => (
              <section key={section.id} className="space-y-2.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2d3435]">
                  {section.label}
                </h4>
                {renderSectionBody(section, 'academic')}
              </section>
            ))}
          </aside>
        )}
      </div>
    </div>
  )
}

export function ResumePreview({ resumeName, templateId, sections, profile }: Props) {
  const template = getResumeTemplate(templateId)
  const header = buildResumePreviewHeader({
    ...profile,
    name: resumeName || profile.name,
  })
  const visibleSections = buildResumePreviewSections(profile, sections)

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Live preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#2d3435]">{resumeName || 'Untitled resume'}</h2>
        </div>
        <div className="rounded-full border border-[#dde4e5] bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#757c7d]">
          {template.name}
        </div>
      </div>

      {template.id === 'executive-classic' && (
        <ExecutivePreview header={header} sections={visibleSections} />
      )}
      {template.id === 'academic-cv' && <AcademicPreview header={header} sections={visibleSections} />}
      {template.id === 'modern-minimalist' && (
        <ModernPreview header={header} sections={visibleSections} />
      )}

      {visibleSections.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-[#dde4e5] bg-white px-5 py-8 text-center text-sm italic text-[#757c7d]">
          Enable at least one section to populate the preview.
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Preview uses your saved profile as the content source. PDF export still comes in the next
        phase.
      </p>
    </section>
  )
}
