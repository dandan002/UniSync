# Manual Editing Dashboard Design

## Objective

Rework the manual editing phase at `/dashboard/resume/[id]` so the app follows the Stitch `Resume Editor (Neutral)` screen as the primary design source. The implementation should preserve the current route, data flow, and save behavior while replacing the generic stacked-card UI with the editorial workspace defined by the UniSync Stitch design system.

## Scope

In scope:

- Rebuild the manual editing dashboard layout and styling to match the Stitch editor direction.
- Keep the existing resume editing capabilities:
  - rename the resume
  - choose a template
  - enable and disable sections
  - reorder sections
  - save changes
- Preserve current server actions and resume data contracts unless a minimal compatibility adjustment is required.
- Review the adjacent Stitch screens to assess whether they still align with the same visual system.

Out of scope:

- Reworking the global dashboard shell unless the editor needs a minimal shared styling adjustment.
- Adding PDF preview, export, or richer live editing interactions.
- Editing non-editor Stitch screens.
- Changing the onboarding or resume creation flow.

## Primary Design Source

The Stitch `UniSync` project is the source of truth for this task, specifically the `Resume Editor (Neutral)` screen. Existing application UI is secondary and should be adjusted to better reflect the Stitch screen where they differ.

## Layout Architecture

The editor should become a three-zone workspace:

1. A top-level editorial canvas with generous page padding and muted off-white background.
2. A main builder column containing editable controls and save feedback.
3. A paper-style summary panel that visually represents the resume object and its current configuration.

The page should read as a curated workspace rather than a stack of settings cards. Section boundaries should be created through spacing and tonal surface shifts rather than heavy borders.

## Visual System Requirements

The implementation should follow the existing UniSync Stitch design system:

- Use the high-key off-white surface hierarchy already reflected in the global tokens.
- Prefer tonal layering over explicit borders.
- Use Newsreader-driven editorial headings where the screen needs prestige and Inter-style utility text for controls and metadata.
- Keep the preview-like summary panel as the most paper-like surface on the page.
- Reserve blue as a progress and action signal, primarily for save and selected states.

Specific rules:

- Avoid default card stacks with visible outlines as the primary organizing pattern.
- Inputs should feel lightweight and editorial, with subdued containment and clearer emphasis on focus/selection.
- Lists should separate via spacing and surface contrast first; visible borders are fallback only when necessary.

## Component Plan

### Resume Header

The resume name control becomes the top editorial field in the builder column. It should feel like the page title rather than a standard form input. Save action remains nearby and visible from the builder context.

### Template Selection

Template choice remains a selectable set of options, but presented as a curated gallery rather than standard bordered tiles. Selected state should be clear through tonal contrast, signal color, and subtle emphasis, not a harsh outlined box.

### Section Organizer

The section list remains reorderable and toggleable. Each row should read as part of a composed sequence with restrained controls, light tonal grouping, and clear order/status cues.

### Summary Panel

The right-side panel acts as a paper object that summarizes the current setup:

- selected template
- enabled section count
- short copy about the current editing phase

It is not a live PDF preview yet, but it should visually reserve that role in the product.

### Feedback States

Save success and error feedback remain inline within the builder area. No toast system is required for this task.

## Data and Behavior

No functional changes are planned for:

- route structure
- `getResume`
- `updateResume`
- template definitions
- section ordering logic

The component rewrite should be purely presentational plus any small structural changes needed to support the new layout.

## Implementation Boundary

Implementation stays focused on:

- `src/app/dashboard/resume/[id]/page.tsx`
- `src/components/resume/ResumeBuilderForm.tsx`
- minimal shared styling or token usage only if required to express the Stitch system cleanly

No broader dashboard redesign is included in this task.

## Stitch Audit Requirement

After implementing the editor, review the adjacent Stitch screens:

- `Landing & Upload (Neutral)`
- `My Resumes (Neutral)`
- `Template Gallery (Neutral)`

Report whether they appear consistent with the same visual system as the editor and note any obvious drift. Do not edit those screens as part of this task.

## Testing

Verification should cover:

- resume detail page renders without layout regressions
- existing save flow still works
- section reorder and toggle interactions still function
- selected template state still persists through save

At minimum, run the relevant test suite and any focused verification needed for the affected route/component.
