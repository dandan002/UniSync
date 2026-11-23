# Unisync

Early-career platform for the Philippines: students go from no resume to their first OJT application by chatting with Sync, schools track every CHED internship form, and employers hire school-verified interns.

This repo holds the UI scaffold (design mockups). There is no app code yet.

## What's here

```
design/
  canvas.json               Artboard layout for the design canvas
  Main.dc.html              Landing page: first question inline, live resume preview
  Student-Onboarding.dc.html  One question per screen, resume builds live, contact asked after the resume
  Student-Ready.dc.html     Resume preview, template switcher, hold-to-approve, school forms progress
  Student-Jobs.dc.html      Job cards with company logos and a full job description slide-over
  Student-Home.dc.html      Next interview, applications, updates, school forms progress
  Coordinator.dc.html       School OJT console: students, needs-attention, bulk actions
  Users.dc.html             People, roles, company checks, activity log, invite dialog
  Employer.dc.html          Applicant board with candidate profiles
  vendor/motion-14.14.0.js  Motion (motion.dev) browser build used for animations
```

## Design system

- Font: Instrument Sans 400–600 everywhere (headings at 400 with tight tracking)
- Colors: one periwinkle family plus a matching lilac. Ink `#1E2140`, muted text `#5E6280`, borders `#E6E7F2`, surface `#F4F5FC`, primary fill `#D4DAFF` (hover `#B8C1FA`), soft fill `#E8EBFF`, accent mark `#7C88DC`, accent text `#4A55A8`, lilac `#A99BF0` / `#F1EDFF` / `#6A5DC2`
- Spacing and shape: 8px spacing scale, 8px button and 10–12px card radii, hairline borders, faint shadows (Mercury-style)
- Motion: spring transitions, staggered reveals, hover lift and press feedback via Motion's `animate`, `stagger`, `inView`, `hover` and `press`

## Viewing the files

The `.dc.html` files are Claude Design artboards. They load `./support.js` from the design runtime and Motion from the canvas asset store (`/_blob/...`), so they won't render as plain HTML on their own. To run them outside the canvas, point the Motion `<script>` at `design/vendor/motion-14.14.0.js` and port each artboard's markup and `Component` class into your framework of choice.

Company names and logos in the mockups are placeholders.
