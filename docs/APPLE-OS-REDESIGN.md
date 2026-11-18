# Apple-inspired UI/UX Redesign

## Approved direction
- Appearance: Light by default; preserve explicit dark appearance hooks.
- Material: Balanced Liquid Glass, used on application chrome rather than every content surface.
- Navigation: Finder-inspired persistent sidebar with compact section labels.
- Scope: Global application shell and shared visual language across all routes.

## Implementation approach
This is a progressive visual layer over the existing Vite + vanilla JavaScript application. It deliberately does not replace routing, page modules, Supabase clients, authorization, tenant boundaries, AI provider calls, offline storage, or business data contracts.

### Files
- `src/styles/apple-os.css`: design tokens and global visual overrides.
- `src/main.js`: loads the new visual layer after the existing stylesheet.
- `index.html`: browser theme color follows the light appearance.

### Design principles
- System-first typography and restrained Apple-blue accent.
- Warm light-gray canvas, white content surfaces, fine separators and soft elevation.
- Translucent blur reserved for sidebar, top bar and mobile navigation.
- Clear active navigation state and predictable hover/focus feedback.
- Reduced-motion support and responsive layouts retained.
- Dark appearance CSS hooks remain available for a future verified theme-toggle integration.

## Validation checklist
- [ ] Install dependencies with the lockfile.
- [ ] Run unit tests.
- [ ] Run code, egress and deep audits.
- [ ] Run production build and bundle-secret checks.
- [ ] Verify navigation and route changes on desktop and mobile.
- [ ] Verify project-scoped navigation and admin-only navigation.
- [ ] Verify light appearance across representative technical, AI, document and reporting routes.
- [ ] Verify Supabase RLS, role gates, AI proxy and quota behavior are unchanged.

## Rollout
Merge only after CI and manual visual regression checks pass. This branch is intentionally isolated so the redesign can be reviewed without changing the production default branch.
