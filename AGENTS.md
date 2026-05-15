# Hackmate — Agent Guidelines

## Design System: "Obsidian"

Every UI component MUST follow this design system. No exceptions.

### Color Tokens (CSS Variables)

```css
--bg-root: #09090B;        /* Page background */
--bg-surface: #131316;     /* Cards, panels */
--bg-raised: #1C1C1F;      /* Hover states, elevated surfaces */
--bg-elevated: #222225;    /* Popovers, dropdowns */
--bg-overlay: rgba(9,9,11,0.85); /* Fixed headers with blur */

--text-primary: #FAFAFA;   /* Headings, primary text */
--text-secondary: #A1A1AA; /* Body text, descriptions */
--text-muted: #71717A;     /* Labels, captions */
--text-inverse: #09090B;   /* Text on accent backgrounds */

--accent: #0EA5E9;         /* Primary action color (sky blue) */
--accent-hover: #38BDF8;   /* Accent hover state */
--accent-dim: rgba(14,165,233,0.1);  /* Accent background tint */
--accent-glow: rgba(14,165,233,0.15); /* Glow effects */

--success: #10B981;
--error: #EF4444;
--warning: #F59E0B;

--border-subtle: #1E1E22;
--border-default: #27272A;
--border-strong: #3F3F46;
--border-accent: rgba(14,165,233,0.3);
```

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | **Outfit** | 700 | Page titles, section headings |
| Body | **DM Sans** | 400-600 | Body text, UI labels, buttons |
| Mono | **JetBrains Mono** | 500 | Status badges, timestamps, code |

- NEVER use Inter, Roboto, Arial, or system fonts
- NEVER use hard-coded font names — always use `var(--font-display)`, `var(--font-body)`, `var(--font-mono)`

### Border Radius

```css
--radius-sm: 4px;   /* Small elements: badges, tags */
--radius-md: 6px;   /* Buttons, inputs, cards */
--radius-lg: 10px;  /* Large cards, modals */
--radius-xl: 14px;  /* Feature cards */
```

- Primary UI elements: 4-6px (sharp, intentional)
- Cards and panels: 10px max
- NEVER use rounded-full on cards or buttons (only on pills/badges)

### Shadows

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.25);
--shadow-accent: 0 0 20px rgba(14,165,233,0.2);
--shadow-glow: 0 0 40px rgba(14,165,233,0.1);
```

### Component Patterns

#### Buttons
```tsx
// Primary
<button className="btn btn-primary">Action</button>

// Secondary
<button className="btn btn-secondary">Cancel</button>

// Ghost
<button className="btn btn-ghost">Skip</button>

// Danger
<button className="btn btn-danger">Delete</button>
```

#### Inputs
```tsx
<input className="input" placeholder="..." />
<select className="input">...</select>
<textarea className="input">...</textarea>
```

#### Cards
```tsx
<div className="card p-5">...</div>
```

#### Badges
```tsx
<span className="badge badge-primary">Status</span>
<span className="badge badge-success">Active</span>
<span className="badge badge-danger">Error</span>
```

### Layout Classes

```css
.org-shell    /* Full-height flex container */
.org-page     /* Centered content wrapper (max-width: 1200px) */
```

### Animation Rules

- Entry animations: `fadeInUp` with staggered delays (60ms intervals)
- Hover transitions: 200ms ease-out
- Glow effects on interactive elements: `box-shadow: var(--shadow-glow)`
- Accent border on hover: `border-color: var(--accent)`

### What NOT To Do

1. NEVER use hardcoded colors — always use CSS variables
2. NEVER use `rounded-full` on cards, buttons, or inputs
3. NEVER use Inter, Roboto, Space Grotesk, or system fonts
4. NEVER use purple gradients on white backgrounds
5. NEVER use `text-gray-*` or `bg-gray-*` Tailwind classes — use CSS variables
6. NEVER add comments to code unless explicitly requested
7. NEVER use inline styles when CSS classes or Tailwind utilities work
8. NEVER converge on the same design across different pages — each section should feel intentional
