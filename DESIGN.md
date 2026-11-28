# Viva Bolivia — Design direction

## Product
Viva Bolivia helps people plan local tourism and food outings in Cochabamba according to their available time, budget, interests, and the local catalogue.

## Surface mode
Operate: the visitor completes a planning task. Visual expression supports clarity, trust, and a sense of place.

## Audience and use context
People planning a local outing who need to compare available time, budget, and place categories before leaving. The interface must work on desktop and mobile.

## Brand direction
Editorial travel journal rooted in the Cochabamba valley: warm paper, deep botanical green, clay/terracotta accents, and muted highland landscape tones. It should feel locally grounded, thoughtful, confident, and contemporary—not like a generic travel marketplace.

## Visual system
- Display: DM Serif Display; body and controls: DM Sans.
- Palette: deep forest `#17372d`, forest `#244f3e`, clay `#b96345`, warm paper `#f2efe7`, surface `#fffdf8`, muted gold `#c69a5b`.
- Layout: asymmetrical editorial hero with an original valley illustration; task-first planner grid; calm result surface.
- Shapes: restrained corners, thin borders, tactile paper-like surfaces; avoid repeated pill cards and generic gradients.
- Motion: purposeful, restrained, fast; entrances use opacity + transform; controls use small state feedback; reduced-motion preference is respected.
- Accessibility: visible focus, semantic landmarks, readable contrast, mobile-first adaptation, reduced motion.

## Product constraints
Preserve Angular architecture, existing form modes, API contracts, route generation, validation, result data, and offline/error behavior. Do not fabricate local places, costs, hours, or route facts.

## Location and map experience
- The visitor explicitly opts in before browser geolocation is requested.
- An embedded Google map centers on the visitor's location, first route stop, or Cochabamba fallback.
- Route directions and accommodation discovery open Google Maps in a new tab.
- The current embed is a Google Maps search embed; full in-page custom route rendering and Places results require a restricted Google Maps Platform API key and enabled billing/APIs.
- Do not claim that lodging is vetted or booked. The lodging action opens a Google Maps search near the route destination.
