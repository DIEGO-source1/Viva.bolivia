---
name: emil-design-engineering
description: Apply Emil Kowalski's design-engineering principles to Viva Bolivia's UI, motion, interaction feedback, and implementation quality. Use for frontend design and animation work.
---

# Emil Design Engineering — Viva Bolivia

Use alongside the original Emil Kowalski Skills plugin installed in Claude and the project skills `impeccable`, `taste`, and `animation-craft`.

## Principles
- Treat interface details as product quality, not decoration.
- Make interactions feel immediate and intentional.
- Prefer transform and opacity for motion; keep motion performant.
- Use spring-like or easing behavior only when it clarifies physical interaction; avoid gratuitous bounce.
- Ensure controls have precise hover, pressed, focus, disabled, and loading feedback.
- Keep timing coherent across the interface.
- Design responsive behavior deliberately for touch and pointer devices.
- Preserve semantic HTML, keyboard access, and reduced-motion preferences.

## Viva Bolivia constraints
- Preserve Angular component boundaries, bindings, outputs, validation, API calls, and route data contracts.
- Do not invent map coordinates, place details, ratings, opening hours, or accommodation inventory.
- Ask for location permission only after the user explicitly presses the location control.
- Keep map and directions links grounded in real route coordinates from the API.

## Original source
https://github.com/emilkowalski/skills
