# Profile AI Rewrite Tools Design

## Objective

Add AI-assisted rewriting to the profile editor at `/dashboard/profile` so users can improve their saved profile content without leaving the editing workflow. The first version should support both targeted rewrite actions and a full-profile rewrite pass while keeping all generated changes staged as suggestions until the user explicitly accepts them.

## Scope

In scope:

- Add targeted rewrite actions for profile content areas in the existing profile editor.
- Add a top-level `Improve profile` action that requests suggestions across the whole profile.
- Stage AI output as suggestions instead of auto-applying it.
- Let users accept or dismiss suggestions before saving.
- Keep the UI aligned with the UniSync Stitch visual system.
- Add server-side rewrite generation using OpenRouter with a structured response contract.

Out of scope:

- Auto-applying AI changes directly into saved profile data.
- Adding chat-style AI interactions.
- Persisting suggestion drafts in Supabase before user acceptance.
- JD matching.
- Drag-and-drop reordering.
- Mobile-specific optimization beyond preserving workable layouts for the updated editor.
- Resume builder and PDF export work.

## Current Codebase Baseline

The existing profile editing flow already supports:

- loading saved profile data through `getProfile`
- editing profile fields in `ProfileForm`
- saving accepted values through `saveProfile`
- importing parsed resume content into the same editor

The codebase does not currently implement:

- AI rewrite endpoints for profile editing
- suggestion state alongside current form state
- per-field or full-profile AI controls
- review UX for accepting or dismissing AI output

## Product Behavior

The profile editor remains the main working surface. AI acts as a drafting aid layered into that editor rather than a separate mode.

The first version includes two rewrite entry points:

1. Scoped rewrite actions attached to relevant areas of the form.
2. A top-level `Improve profile` action that requests suggestions for the entire profile.

Supported content scope for rewriting:

- name
- headline
- summary
- skills
- interests
- miscellaneous
- experience block content
- education block content where rewrite assistance is meaningful

AI output must never overwrite the current form automatically. Instead:

- generated content is stored as staged suggestions
- users review suggestions inline
- users accept or dismiss each suggestion explicitly
- accepted suggestions copy into the editable form state
- users still use the normal save action to persist accepted changes

## UI Architecture

Implementation stays inside the current profile editor route and component structure.

### Top-Level AI Toolbar

Add a restrained AI actions band near the top of the profile form. It should include:

- a primary `Improve profile` action
- compact explanatory copy describing that suggestions are reviewable before saving
- scoped loading and error feedback

This toolbar should feel editorial and product-native, not like a chatbot panel.

### Inline Rewrite Controls

Add smaller rewrite actions in the sections where they are most useful:

- headline
- summary
- skills/interests/miscellaneous groups
- each experience block
- each education block if the content is text-rich enough to benefit

These actions should only affect the relevant scope.

### Suggestion Presentation

Suggestions appear inline beside the content they propose to change.

Presentation rules:

- scalar fields like `headline` and `summary` get an adjacent suggestion card
- tag collections show suggested replacement chips or sets
- experience and education suggestions are attached to the relevant block
- full-profile rewrites may generate multiple staged suggestions at once, but acceptance remains local per field or block

Each suggestion surface must provide:

- the suggested replacement
- `Accept`
- `Dismiss`

The original editable form value remains visible and intact until acceptance.

## Data Flow

### Existing Source of Truth

The editable form state in `ProfileForm` remains the source of truth for current profile values.

### Suggested Values State

Add a parallel client-side suggestion state keyed by field name or stable block identity.

Required behavior:

- rewrite generation stores results in suggestion state only
- accepting a suggestion copies that suggestion into editable form state
- dismissing a suggestion clears only the staged AI value
- editing a field manually after a suggestion is generated does not silently discard or auto-merge the suggestion

First-version suggestions are ephemeral session state only.

## Rewrite API Contract

Add a dedicated rewrite generation path separate from resume parsing.

### Input

The rewrite endpoint should accept:

- the current structured profile payload
- a scope descriptor
- optional scope identifiers for block-level rewrites

Examples of scope:

- `full-profile`
- `headline`
- `summary`
- `skills`
- `experience`
- `experience:<stable-id>`
- `education:<stable-id>`

### Output

The model should return structured suggested replacements only for the requested scope. The response must be shaped for safe validation and predictable client merges.

The response contract should be explicit about:

- which field or block the suggestion belongs to
- the suggested replacement value
- omission of unchanged areas

Validation should strip unknown fields and reject malformed structures before they reach the editor state.

## OpenRouter Usage

Reuse the existing OpenRouter setup, but define a rewrite-specific prompt contract instead of reusing the resume parser prompt.

Prompt expectations:

- preserve factual meaning unless wording improvement requires small cleanup
- improve clarity, concision, professionalism, and resume-readiness
- return structured JSON only
- do not invent employers, dates, schools, or credentials
- avoid introducing unsupported claims

The route should truncate or otherwise bound payload size to keep requests predictable.

## Error Handling

Failure conditions must not damage current form state.

Rules:

- if the rewrite request fails, keep the current form unchanged
- if the model returns invalid JSON, show inline error feedback and drop the bad suggestion payload
- if only one suggestion in a multi-suggestion response is malformed, reject the response unless partial validation is intentionally supported and explicitly implemented
- loading state should remain scoped to the triggered action where practical

No AI action should trigger a save or navigation side effect.

## Stitch UI Guidance

Use the UniSync Stitch design system as guidance for the upgraded editor UI:

- off-white background hierarchy
- charcoal text
- serif display headings where prestige helps
- restrained grayscale surfaces for controls
- blue reserved for forward actions and active states

Follow the existing insertion rules:

- keep the current route structure and page shell
- add the AI drafting layer inside the existing profile editor
- avoid importing generic AI-assistant styling or a separate side panel unless later work proves it necessary

The editor should remain tighter and more practical than the marketing pages.

## Implementation Boundary

Primary files likely involved:

- `src/app/dashboard/profile/page.tsx`
- `src/components/profile/ProfileForm.tsx`
- `src/components/profile/ExperienceBlock.tsx`
- `src/components/profile/EducationBlock.tsx`
- `src/lib/actions/profile.ts` if save behavior needs compatibility adjustments
- a new rewrite route or server action for AI generation
- `src/lib/schemas.ts` for rewrite request/response validation
- focused tests for rewrite generation and suggestion acceptance

The initial implementation should avoid broad refactors unrelated to AI rewrite behavior.

## Testing

Verification must cover:

- scoped rewrite requests generate suggestions for only the intended area
- full-profile rewrites can stage multiple suggestions at once
- accepting a suggestion updates editable form state
- dismissing a suggestion removes only the staged suggestion
- saving persists only accepted values
- failed rewrite requests leave the form unchanged

Existing resume import parsing remains separate. The current PDF and DOCX extraction path was reviewed during this design pass and the focused extraction/onboarding tests passed, so parser repair is not part of this spec unless a failing sample is identified separately.
