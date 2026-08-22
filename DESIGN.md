# Geist Design System Specification: Vercel-Grade UI/UX for EasyForms

This document defines the complete design token system, visual principles, component states, and transition behaviors required to align **EasyForms** with the design system of **Vercel** (known as the **Geist Design System**).

Vercel’s aesthetic is characterized by **extreme minimalism**, crisp **monochromatic interfaces**, a strict **geometrical grid layout**, and **subtle, high-contrast micro-interactions**.

---

## 1. Core Visual Principles of Vercel (Geist)

1.  **Monochromatic Over Gradients**: Avoid colorful gradients, drop-shadows, or textured backgrounds. Surfaces are pure whites, solid deep grays, or absolute blacks. Color is used sparingly (e.g., green for successes, red for errors, brand blue) and primarily in active feedback nodes.
2.  **Architectural Structure**: Emphasize crisp borders over elevations or floating cards. Surfaces are defined by precise `1px` lines rather than shadows.
3.  **Strict Corners (Low Radius)**: Avoid pill shapes or large border-radius settings. Corners use very tight radii (`4px` to `8px`) to maintain a technical, clean, and developer-centric feel.
4.  **Generous Negative Space (Apple-Level)**: Pages must breathe. Content density is controlled with precise padding values (`px-6 py-8` or `px-8 py-12` is preferred over crammed alternatives).
5.  **Interactive Precision**: Hover states should represent clean, binary shifts (e.g., border color goes from `--accents-2` to `--accents-8`, or background shifts from clear to `--accents-1`).

---

## 2. Complete Design Token System

These variables are defined in the global configuration and must map exactly to Geist design system parameters.

### 2.1 CSS Custom Properties (Geist Core Variables)
Define these in your main CSS file (`index.css`):

```css
:root {
  /* Foreground & Background colors */
  --geist-background: #ffffff;
  --geist-foreground: #000000;

  /* Accent grayscales (light mode) */
  --accents-1: #fafafa;
  --accents-2: #eaeaea;
  --accents-3: #999999;
  --accents-4: #888888;
  --accents-5: #666666;
  --accents-6: #444444;
  --accents-7: #333333;
  --accents-8: #111111;

  /* Visual feedback */
  --geist-error: #ee0000;
  --geist-error-light: #ff000010;
  --geist-success: #0070f3; /* Vercel Brand Blue is Success Blue */
  --geist-success-light: #0070f310;
  --geist-warning: #f5a623;
  --geist-warning-light: #f5a62310;

  /* Typography */
  --font-sans: "Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "Geist Mono", SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;

  /* Structural Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Interaction speeds */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

### 2.2 Geist Typography System & Scale

To maintain clean, uniform, and accessible legibility across all components and devices, typography follows strict scale constraints:

| Token / Utility | Font Size | Weight | Line Height | Letter Spacing | Usage |
| --- | --- | --- | --- | --- | --- |
| `.type-h1` | `32px` (`text-3xl`) | `700` (`bold`) | `1.2` | `-0.03em` | Main page titles, Hero headers |
| `.type-h2` | `24px` (`text-2xl`) | `700` (`bold`) | `1.25` | `-0.02em` | Section headers, Dialog titles |
| `.type-h3` | `18px` (`text-lg`) | `600` (`semibold`) | `1.3` | `-0.01em` | Card titles, Container headers |
| `.type-h4` | `15px` (`text-base`) | `600` (`semibold`) | `1.4` | `0` | Subheaders, Panel titles |
| `.type-body` | `14px` (`text-sm`) | `400` (`normal`) | `1.5` | `0` | Standard body paragraphs, inputs |
| `.type-body-sm` | `13px` (`text-xs`) | `400` / `500` | `1.4` | `0` | Helper text, secondary descriptions |
| `.type-label` | `13px` (`text-xs`) | `500` / `600` | `1.2` | `0` | Form labels, button text, tabs |
| `.type-badge` | `12px` (`text-xs`) | `600` | `1.2` | `0.05em` | Monospace tags, status pills |

#### Typography Rules:
1. **Minimum Legible Text Size (12px / `text-xs`)**: No rendered text element may drop below `12px` (`0.75rem`). Sub-12px styles (`text-[10px]`, `text-[9px]`, `text-[11px]`) are prohibited across all cards, modals, tags, and inputs.
2. **Font Pairings**:
   - Primary Interface (`font-sans`): "Geist Sans", "Geist Variable", System Sans. Used for titles, body text, form elements, buttons.
   - Code & Technical Metadata (`font-mono`): "Geist Mono", SFMono. Used for API keys, JSON payloads, status badges, timestamps.
3. **Weight Hierarchy**: Use `font-semibold` / `font-bold` for structure, `font-medium` for interactive labels, and `font-normal` for body content.

/* Dark Mode Variable Overrides */
.dark {
  --geist-background: #000000;
  --geist-foreground: #ffffff;

  --accents-1: #111111;
  --accents-2: #333333;
  --accents-3: #444444;
  --accents-4: #666666;
  --accents-5: #888888;
  --accents-6: #999999;
  --accents-7: #eaeaea;
  --accents-8: #fafafa;

  --geist-error: #f85149;
  --geist-success: #0070f3;
  --geist-warning: #f5a623;
}
```

---

## 3. Tailwind Configuration Integration

To leverage these tokens fluently via utility classes, configure your `tailwind.config.js` to map directly to these custom properties:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--geist-background)",
        foreground: "var(--geist-foreground)",
        border: "var(--accents-2)",
        ring: "var(--geist-foreground)",
        accent: {
          1: "var(--accents-1)",
          2: "var(--accents-2)",
          3: "var(--accents-3)",
          4: "var(--accents-4)",
          5: "var(--accents-5)",
          6: "var(--accents-6)",
          7: "var(--accents-7)",
          8: "var(--accents-8)",
        },
        error: "var(--geist-error)",
        success: "var(--geist-success)",
        warning: "var(--geist-warning)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      transitionProperty: {
        geist: "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform",
      },
      transitionTimingFunction: {
        geist: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 4. Component-Level Visual Styles

### 4.1 Reusable UI: Buttons (`Button.tsx`)
Vercel buttons are perfectly rectangular (or slightly rounded), flat, with zero gradients or heavy shadows.

```tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium font-sans text-sm rounded-sm transition-geist duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        // Pure solid background, highly prominent
        primary: "bg-foreground text-background hover:bg-opacity-90 active:scale-[0.98]",
        // Bordered, minimal
        secondary: "bg-background text-foreground border border-border hover:bg-accent-1 hover:border-accent-8 active:scale-[0.98]",
        // Flat, subtle text only
        ghost: "bg-transparent text-accent-5 hover:bg-accent-1 hover:text-foreground",
      },
      size: {
        sm: "h-8 px-3 text-xs tracking-tight",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

### 4.2 Reusable UI: Inputs (`Input.tsx`)
Inputs in Geist are razor-sharp. Focus expands the border color to pure black (light mode) or pure white (dark mode) without glow shadows, providing a crisp, technical look.

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-sans placeholder:text-accent-4 text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium transition-geist duration-150 focus-visible:outline-none focus-visible:border-accent-8 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
```

### 4.3 Reusable UI: Cards (`Card.tsx`)
Cards are simple boxes framed with a thin, sharp `1px` border. Hover slightly darkens the background surface or deepens the border.

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-background p-6 transition-geist duration-150 hover:border-accent-8 hover:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

---

## 5. UI/UX Page Layout Rules

1.  **Header & Nav Navigation**: Use transparent/blur backdrops with a subtle border underneath.
    ```tsx
    // CSS Blur styling for the Header navbar
    "sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
    ```
2.  **Navigation Tabs**: Simple plain text layout. Active tab is underlined using a physical, crisp `2px` absolute bottom line of color `--geist-foreground` or a solid background block on active tab.
3.  **Skeleton States over Spinners**: Never use colorful spinning wheels or bulky loaders. Replicate structural pages using beautiful light grayscale pulsing layout containers.
    ```tsx
    // Tailwind Skeleton element
    "animate-pulse rounded-xs bg-accent-1"
    ```
4.  **Badges & Statuses**: Technical and monospace. Use small uppercase labels.
    ```tsx
    // Geist status pill
    "px-2 py-0.5 font-mono text-[10px] uppercase font-semibold border border-border rounded-full bg-accent-1 text-accent-6"
    ```
5.  **Tables / Data Layout**:
    *   No alternating row colors (no zebra-striping).
    *   Rows are separated by a clean `1px border-b border-border`.
    *   Header labels are in bold lowercase/uppercase, sized small (`text-xs`), and colored neutral (`text-accent-4`).
