# Accessibility

Papers Empire strives to meet WCAG 2.1 AA / RGAA best practices. This page tracks the key features and TODOs.

## Navigation & Structure
- Skip link (`.skip-link`) lets keyboard users jump to `#mainContent`.
- Landmarks: `<header role="banner">`, `<main role="main">`, sections with `role="region"` + `aria-label`.
- Language selector updates `<html lang>` when switching languages.
- Log and achievements panels expose `aria-live="polite"` so screen readers hear updates.

## Controls & States
- All buttons/selects inherit `font: inherit` and have visible `:focus-visible` outlines.
- God mode, save/export, achievements, and prestige buttons are keyboard reachable.
- Tooltips and icon buttons include textual equivalents.
- Motion can be reduced by enabling `prefers-reduced-motion` or toggling the “Reduce motion” checkbox.

## Visual Accessibility
- Global contrast uses dark backgrounds with light text (aiming > 4.5:1). A “High contrast” toggle in the accessibility panel swaps to higher contrast colors via CSS classes.
- Base font is 14px, but the “Large text” toggle bumps the root font size for better readability.
- Ripple/animation effects turn off when reduce motion is enabled.
- Social card + meta tags include descriptive text for sharing.

## Persistence of Preferences
- User choices (high contrast, large text, reduce motion) are stored in `localStorage` (`pe-accessibility`).
- Preferences activate on page load before the main script runs to avoid flashes.

## TODO / Ideas
- Add voice guidance or audio cues for key milestones.
- Provide keyboard shortcuts list and allow remapping.
- Expand achievements/log filtering to include screen-reader friendly summaries.
- Offer alternative color palettes (e.g., for protanopia/deuteranopia).
- Automated accessibility tests (axe-core, Playwright + axe) per PR.
