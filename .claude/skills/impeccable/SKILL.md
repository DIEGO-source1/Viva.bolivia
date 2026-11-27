---
name: impeccable
description: Redesign and refine Viva Bolivia's frontend with distinctive visual direction, strong hierarchy, responsive layouts, accessible interactions, and purposeful motion. Use for UI redesign, critique, polish, animation, typography, layout, and frontend quality.
---

# Impeccable — Viva Bolivia project skill

Use this project skill when changing Viva Bolivia's frontend. It is a project-specific companion inspired by the public Impeccable design approach by Paul Bakaus (Apache-2.0): https://github.com/pbakaus/impeccable

## Non-negotiable context
Read `/DESIGN.md` before UI work. This is an existing product refinement, not a greenfield template. Preserve the product's behavior, Angular architecture, local-tourism purpose, current brand direction, and API contracts unless the user explicitly authorizes a change.

## Direction
- Editorial travel journal rooted in Cochabamba's valley.
- Warm paper, deep botanical greens, clay/terracotta and muted gold.
- Distinctive serif display typography paired with clear sans-serif UI typography.
- Use asymmetry, varied rhythm, strong alignment, and purposeful negative space.
- Avoid generic SaaS dashboards, generic travel templates, excessive pills, repeated card grids, gratuitous gradients, glassmorphism, and decoration without meaning.

## Motion playbook
- Motion communicates state, hierarchy, and feedback; it is never ornamental noise.
- Prefer transform and opacity for animation. Avoid animating layout dimensions.
- Use a confident ease-out curve and short durations for controls; longer reveals only for major visual entrances.
- Give interactive controls hover, focus-visible, pressed, loading, success, and disabled states where relevant.
- Respect `prefers-reduced-motion: reduce`; no essential information may depend on animation.
- Keep animations performant and avoid layout shifts.

## Workflow
1. Inspect the exact Angular components and styles in scope.
2. Preserve all existing inputs, outputs, bindings, validation, API calls, loading and error states.
3. Make the smallest complete visual implementation across desktop and mobile.
4. Verify TypeScript/Angular template compatibility and production build when tooling is available.
5. Report unverified runtime behavior honestly; never claim a build or browser test passed unless it was run.

## References
- Impeccable (Paul Bakaus): https://github.com/pbakaus/impeccable
- Impeccable motion command guidance: https://github.com/pbakaus/impeccable/blob/main/.agent/skills/impeccable/reference/animate.md
- Emil Kowalski skills: https://github.com/emilkowalski/skills
