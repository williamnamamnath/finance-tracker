# Styling Template

> Short description: Provide a concise overview of the visual language and styling decisions for this project.

## Styling Library

- Styling library: Tailwind CSS
- Objective of selected styling library: Tailwind CSS will be the main styling theme for this app. To prioritize responsiveness and clean UI and UX

## Design Tokens

- Colors:
	- Primary: #0A84FF — usage: primary buttons, links
	- Secondary: #6E6E6E — usage: secondary text, icons
	- Accent: #FF6B6B — usage: alerts, highlights
	- Background: #FFFFFF
	- Surface: #F7F7F8
	- Success: #28A745, Warning: #FFC107, Danger: #DC3545

- Typography:
	- Primary font: Inter, fallback: system-ui, -apple-system, 'Segoe UI'
	- Base sizes: 16px (root) — Scale: 14 / 16 / 18 / 24 / 32
	- Weights: 400 (regular), 600 (semibold), 700 (bold)

- Spacing (scale): 

## Breakpoints & Responsive

- Breakpoints (min-width):
	- sm: 576px
	- md: 768px
	- lg: 992px
	- xl: over 1200px

## Focus

- Prioritize making websites responsive on mobile devices before accommodating for larger screens

## Iconography & Imagery

- Icon set: [e.g., Feather, Material] — recommended sizes: 16px, 24px, 32px
- Image aspect ratios & usage: hero (16:9), card (4:3), avatar (1:1)
- Charts and visual effects: 

## Component Guidelines

- Buttons:
	- Primary button: background `Primary`, white text, 12px vertical padding, border-radius 8px
	- Secondary button: transparent background, `Secondary` text, 1px border rounded

- Forms:
	- Inputs: 40px height, 8px internal padding, subtle border, focused outline color = `Primary`

- Cards:
	- Surface color, 16px padding, medium elevation, rounded corners

## Accessibility

- Contrast: Ensure text meets WCAG AA (minimum contrast ratio 4.5:1 for normal text).
- Motion: Provide reduced-motion variants and respect `prefers-reduced-motion`.
- Focus: Visible focus styles for keyboard navigation.