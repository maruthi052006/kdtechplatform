# Design System & UI Tokens Specification
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Aesthetic:** Modern Technical SaaS (Developer Platform meets Enterprise EdTech)  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Design Philosophy & Visual Language

KDTechX rejects both generic corporate dashboard templates and overblown, distracting glassmorphism gimmicks. The interface embodies a **high-precision, developer-grade aesthetic**:
- **Information Density**: Crisp, high-contrast layouts engineered for fast scanning of tabular data, technical code snippets, and assessment metrics.
- **Purposeful Color Application**: 90% monochrome baseline surfaces accented with electric cyan and vivid indigo to direct cognitive focus toward actionable elements and active states.
- **Micro-Precision Feedback**: Sub-200ms spring animations, tangible hover borders, and tactile keyboard navigation for distraction-free assessment workflows.

---

## 2. Design Tokens & CSS Custom Properties

### 2.1 Color Palette

#### Dark Mode (Default Theme)
```css
:root[data-theme='dark'], .dark {
  /* Backgrounds & Surfaces */
  --bg-canvas: #090d16;          /* Deepest navy/black backdrop */
  --bg-surface: #0f172a;         /* Base card & panel container */
  --bg-surface-elevated: #1e293b;/* Hover & elevated modal surface */
  --bg-surface-subtle: #141e33;  /* Subdued section fill */

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --border-focus: #38bdf8;

  /* Typography */
  --text-primary: #f8fafc;       /* Highest contrast headers and values */
  --text-secondary: #94a3b8;     /* Supporting body descriptions */
  --text-muted: #64748b;         /* Disabled state and subtle metadata */

  /* Brand Accents */
  --brand-cyan: #06b6d4;
  --brand-blue: #2563eb;
  --brand-indigo: #6366f1;
  --brand-gradient: linear-gradient(135deg, #06b6d4 0%, #2563eb 50%, #4f46e5 100%);

  /* Semantic Feedback */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #0284c7;
}
```

#### Light Mode (Intentional, High-Contrast Light Theme)
```css
:root[data-theme='light'], .light {
  /* Backgrounds & Surfaces */
  --bg-canvas: #f8fafc;          /* Clean off-white paper canvas */
  --bg-surface: #ffffff;         /* Pure white container cards */
  --bg-surface-elevated: #f1f5f9;/* Light slate hover layers */
  --bg-surface-subtle: #e2e8f0;  /* Secondary dividers */

  /* Borders & Dividers */
  --border-subtle: #e2e8f0;
  --border-strong: #cbd5e1;
  --border-focus: #0284c7;

  /* Typography */
  --text-primary: #0f172a;       /* Deep slate primary text */
  --text-secondary: #475569;     /* Slate body text */
  --text-muted: #94a3b8;         /* Subdued captions */

  /* Brand Accents */
  --brand-cyan: #0891b2;
  --brand-blue: #1d4ed8;
  --brand-indigo: #4338ca;
  --brand-gradient: linear-gradient(135deg, #0891b2 0%, #1d4ed8 50%, #4338ca 100%);

  /* Semantic Feedback */
  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-info: #0369a1;
}
```

---

## 3. Typography System

- **Primary Typeface**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
- **Monospace Typeface**: `JetBrains Mono`, `Fira Code`, `Consolas`, `monospace` (for code questions & IDs)

| Style Token | Font Size | Line Height | Weight | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display` | 2.5rem (40px) | 1.15 | 800 | -0.03em | Landing Hero |
| `h1` | 2.0rem (32px) | 1.2 | 700 | -0.025em | Main Dashboard Title |
| `h2` | 1.5rem (24px) | 1.25 | 600 | -0.02em | Section Headers |
| `h3` | 1.25rem (20px) | 1.3 | 600 | -0.015em | Card Titles |
| `body-lg` | 1.125rem (18px) | 1.5 | 400 | normal | Exam Question Prompts |
| `body-base` | 1.0rem (16px) | 1.5 | 400 | normal | Standard Content Text |
| `body-sm` | 0.875rem (14px) | 1.45 | 400/500 | normal | Form Labels & Meta |
| `caption` | 0.75rem (12px) | 1.4 | 500 | 0.02em | Badges & Table Headers |
| `code` | 0.875rem (14px) | 1.6 | 400 | normal | Technical Questions |

---

## 4. Spacing, Elevation & Radius Tokens

```css
/* Elevation Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-elevated: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -4px rgba(0, 0, 0, 0.15);
--shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.35);

/* Border Radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-pill: 9999px;
```

---

## 5. Responsive Viewport Breakpoints

| Breakpoint | Minimum Width | Target Devices | Layout Behavior |
|---|---|---|---|
| `xs` | `320px` - `479px` | Compact SmartPhones (iPhone SE) | Single column, drawer nav, stacked cards |
| `sm` | `480px` - `767px` | Large SmartPhones & Phablets | Single column, touch-optimized tap targets |
| `md` | `768px` - `1023px` | Tablets & Small Laptops | 2-column grids, collapsible rail sidebar |
| `lg` | `1024px` - `1279px` | Standard Laptops | 3-column grids, full sidebar, data tables |
| `xl` | `1280px` - `1535px` | High-Res Desktop Monitors | Fixed container (1280px max-width) |
| `2xl` | `1536px` - `2560px` | Ultra-wide Displays | Centered container, ample whitespace |

---

## 6. Motion & Accessibility Directives

### 6.1 Framer Motion Spring Standards
```typescript
export const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const pageFadeVariant = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};
```

### 6.2 Reduced Motion Compliance
All motion animations must listen to `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6.3 WCAG AA Focus & Contrast Rules
- Visible focus indicator: `outline: 2px solid var(--brand-cyan); outline-offset: 2px;`
- Contrast ratio: Minimum 4.5:1 for body copy against all surfaces.
- ARIA semantics: Dialogs use `role="dialog" aria-modal="true"`, buttons have accessible labels.
