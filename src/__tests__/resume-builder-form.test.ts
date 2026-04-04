// @vitest-environment happy-dom
import { act, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResumeDetailPage from '@/app/dashboard/resume/[id]/page'
import { ResumeBuilderForm } from '@/components/resume/ResumeBuilderForm'
import { getResume, updateResume } from '@/lib/actions/resume'
import type { ResumeRecord } from '@/lib/types'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true

vi.mock('@/lib/actions/resume', () => ({
  getResume: vi.fn(),
  updateResume: vi.fn(),
}))

const mockedGetResume = vi.mocked(getResume)
const mockedUpdateResume = vi.mocked(updateResume)

const resume: ResumeRecord = {
  id: 'resume-1',
  name: 'Spring 2026 Resume',
  template_id: 'modern-minimalist',
  sections_config: [
    { id: 'summary', label: 'Summary', order: 0, enabled: true },
    { id: 'experience', label: 'Experience', order: 1, enabled: true },
    { id: 'skills', label: 'Skills', order: 2, enabled: false },
  ],
  created_at: '2026-04-03T00:00:00.000Z',
  updated_at: '2026-04-03T00:00:00.000Z',
}

function renderResumeBuilderForm(record: ResumeRecord) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(createElement(ResumeBuilderForm, { resume: record }))
  })

  return {
    container,
    cleanup() {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

function getByRoleName(container: HTMLElement, role: 'button' | 'checkbox', name: string) {
  const selector = role === 'button' ? 'button' : 'input[type="checkbox"]'
  const candidates = container.querySelectorAll(selector)
  const element = [...candidates].find((candidate) => {
    const accessibleName =
      candidate.getAttribute('aria-label') ?? candidate.textContent?.trim() ?? ''
    return accessibleName === name
  })
  if (!element) throw new Error(`Missing ${role} with name "${name}"`)
  return element as HTMLButtonElement | HTMLInputElement
}

function getButtonByText(container: HTMLElement, text: string) {
  const button = [...container.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === text
  )
  if (!button) throw new Error(`Missing button with text "${text}"`)
  return button as HTMLButtonElement
}

function getSummaryAside(container: HTMLElement) {
  const aside = container.querySelector('aside')
  if (!aside) throw new Error('Missing summary aside')
  return aside as HTMLElement
}

function getDefinitionValue(container: HTMLElement, term: string) {
  const aside = getSummaryAside(container)
  const dt = [...aside.querySelectorAll('dt')].find((element) => element.textContent?.trim() === term)
  if (!dt) throw new Error(`Missing definition term "${term}"`)
  const value = dt.nextElementSibling
  if (!value || value.tagName !== 'DD') {
    throw new Error(`Missing definition value for "${term}"`)
  }
  return value.textContent?.trim() ?? ''
}

function getTemplateRadio(container: HTMLElement, name: string) {
  const labels = [...container.querySelectorAll('label')]
  const label = labels.find((element) => element.textContent?.includes(name))
  if (!label) throw new Error(`Missing template label "${name}"`)
  const radio = label.querySelector('input[type="radio"]')
  if (!radio) throw new Error(`Missing template radio "${name}"`)
  return radio as HTMLInputElement
}

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('ResumeBuilderForm', () => {
  beforeEach(() => {
    mockedGetResume.mockReset()
    mockedGetResume.mockResolvedValue(resume)
    mockedUpdateResume.mockReset()
    mockedUpdateResume.mockResolvedValue(undefined)
  })

  it('frames the resume editor with editorial workspace copy', async () => {
    const page = await ResumeDetailPage({
      params: Promise.resolve({ id: resume.id }),
    })

    const markup = renderToStaticMarkup(page)

    expect(markup).toContain('Manual editing')
    expect(markup).toContain('Back to resumes')
    expect(markup).toContain('href="/dashboard/resumes"')
    expect(markup).toContain('<h1 class="font-display text-4xl font-semibold tracking-tight text-foreground">Shape the final resume</h1>')
    expect(markup).toContain('<h2 class="font-display text-3xl font-bold">Builder</h2>')
    expect(markup).toContain('max-w-[1440px]')
    expect(markup).toContain('pb-16 pt-10')
    expect(markup).toContain('lg:px-10')
    expect(mockedGetResume).toHaveBeenCalledWith(resume.id)
  })

  it('shows the stitch-style paper summary with live configuration details', async () => {
    const { container, cleanup } = renderResumeBuilderForm(resume)

    try {
      const summary = getSummaryAside(container)

      expect(summary.textContent).toContain('Selected template')
      expect(summary.textContent).toContain('Enabled sections')
      expect(summary.textContent).toContain('PDF preview and export arrive in the next phase.')
      expect(getDefinitionValue(container, 'Selected template')).toBe('Modern Minimalist')
      expect(getDefinitionValue(container, 'Enabled sections')).toBe('2 of 3')

      await act(async () => {
        getTemplateRadio(container, 'Executive Classic').click()
        getByRoleName(container, 'checkbox', 'Skills').click()
        await Promise.resolve()
      })

      expect(getDefinitionValue(container, 'Selected template')).toBe('Executive Classic')
      expect(getDefinitionValue(container, 'Enabled sections')).toBe('3 of 3')
    } finally {
      cleanup()
    }
  })

  it('submits the edited name, template, and reordered sections when saving', async () => {
    const { container, cleanup } = renderResumeBuilderForm(resume)

    try {
      await act(async () => {
        const nameInput = container.querySelector('label input') as HTMLInputElement
        setInputValue(nameInput, 'Editorial Resume')

        const executiveClassic = getTemplateRadio(container, 'Executive Classic')
        executiveClassic.click()

        getByRoleName(container, 'button', 'Move Skills up').click()

        const skillsToggle = getByRoleName(container, 'checkbox', 'Skills') as HTMLInputElement
        skillsToggle.click()
        getButtonByText(container, 'Save changes').click()

        await Promise.resolve()
      })

      const executiveClassic = getTemplateRadio(container, 'Executive Classic')
      expect(executiveClassic.checked).toBe(true)
      expect(mockedUpdateResume).toHaveBeenCalledTimes(1)
      const [resumeId, payload] = mockedUpdateResume.mock.calls[0]
      expect(resumeId).toBe('resume-1')
      expect(payload).toEqual({
        name: 'Editorial Resume',
        template_id: 'executive-classic',
        sections_config: [
          { id: 'summary', label: 'Summary', enabled: true, order: 0 },
          { id: 'skills', label: 'Skills', enabled: true, order: 1 },
          { id: 'experience', label: 'Experience', enabled: true, order: 2 },
        ],
      })
    } finally {
      cleanup()
    }
  })
})
