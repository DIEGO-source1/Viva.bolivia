---
name: animation-craft
description: Add purposeful, performant motion and microinteractions to Viva Bolivia's Angular interface. Use for entrance choreography, hover and press feedback, loading and result transitions, and responsive motion refinement.
---

# Animation Craft — Viva Bolivia

Use this project skill together with `.claude/skills/impeccable/SKILL.md` and `/DESIGN.md`.

## Motion intent
Motion should make the interface easier to understand: reveal hierarchy, show state changes, acknowledge input, and make route results feel considered. Do not add motion merely to decorate the page.

## Timing and easing
- Small control feedback: 140–220 ms.
- Component entrances: 450–700 ms.
- Use a decelerating curve such as `cubic-bezier(.16, 1, .3, 1)`.
- Prefer opacity and transform. Avoid animating width, height, margin, or padding.
- Stagger related result rows subtly; do not delay access to essential content.
- Avoid bounce, elastic overshoot, continuous ambient movement, and parallax that competes with reading.

## Angular UI states
Provide considered motion for:
- Initial page entrance.
- Switching between AI and manual form modes (without changing form state contracts).
- Loading and API error feedback.
- Empty result, missing-data, and successful route states.
- Route stop cards and verification status.

## Accessibility and performance
- Respect `prefers-reduced-motion: reduce`.
- Keep focus indicators independent from hover.
- Do not use animation to communicate status without text or another non-motion cue.
- Avoid layout shift and expensive filters on large surfaces.
- Test narrow screens and keyboard navigation.

## Implementation guardrails
- Preserve Angular inputs, outputs, signals, API contracts, validation, and existing business logic.
- Do not introduce a motion library unless the project owner approves the dependency.
- Use CSS transitions/keyframes for the current Angular surface.
- Confirm that all animations stop or simplify under reduced-motion preferences.

## References
- Impeccable: https://github.com/pbakaus/impeccable
- Impeccable animation playbook: https://github.com/pbakaus/impeccable/blob/main/.agent/skills/impeccable/reference/animate.md
- Emil Kowalski skills: https://github.com/emilkowalski/skills
- Emil Kowalski animation engineering principles: https://emilkowal.ski/
