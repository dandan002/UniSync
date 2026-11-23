# Unisync

Early-career platform for the Philippines: students go from no resume to their first OJT application by chatting with Sync, schools track every CHED internship form, and employers hire school-verified interns.

This repo holds the UI scaffold (design mockups). There is no app code yet.

## What's here

```
design/
  canvas.json               Artboard layout for the design canvas
  Main.dc.html              Landing page
  Student-Onboarding.dc.html  One-question-per-screen signup with Sync (saved progress, "x of 8")
  Student-Ready.dc.html     Resume preview, template switcher, hold-to-approve, school forms progress
  Student-Jobs.dc.html      Job cards with company logos and a full job description slide-over
  Student-Home.dc.html      Next interview, applications, updates, school forms progress
  Coordinator.dc.html       School OJT console: students, needs-attention, bulk actions
  Users.dc.html             People, roles, company checks, activity log, invite dialog
  Employer.dc.html          Applicant board with candidate profiles
  vendor/motion-14.14.0.js  Motion (motion.dev) browser build used for animations
```

## Design system

- Font: Plus Jakarta Sans (Google Fonts)
- Colors: ink `#16161A`, muted text `#5E5E66`, borders `#ECEBE8`, warm surface `#F6F5F2`, action blue `#2F5BEA`, brand sun `#FFB020`, success `#1A7F45`
- Shapes: pill buttons, 18–24 px card radius, hairline borders, soft shadows on hover only
- Motion: spring transitions, staggered reveals, hover lift and press feedback via Motion's `animate`, `stagger`, `inView`, `hover` and `press`

## Viewing the files

The `.dc.html` files are Claude Design artboards. They load `./support.js` from the design runtime and Motion from the canvas asset store (`/_blob/...`), so they won't render as plain HTML on their own. To run them outside the canvas, point the Motion `<script>` at `design/vendor/motion-14.14.0.js` and port each artboard's markup and `Component` class into your framework of choice.

Company names and logos in the mockups are placeholders.
