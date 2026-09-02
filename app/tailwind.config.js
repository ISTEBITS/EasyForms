/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "2.5rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },

    extend: {
      colors: {
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        "background-tertiary": "var(--background-tertiary)",

        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        "foreground-subtle": "var(--foreground-subtle)",

        ink: "var(--ink, #171717)",
        canvas: "var(--canvas, #fafafa)",
        "canvas-elevated": "var(--canvas-elevated, #ffffff)",
        hairline: "var(--hairline, #ebebeb)",
        "hairline-soft": "var(--hairline-soft, #f2f2f2)",

        border: "var(--border)",
        "border-hover": "var(--border-hover)",

        surface: "var(--surface)",
        "surface-solid": "var(--surface-solid)",

        ring: "var(--foreground)",

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

        link: {
          DEFAULT: "var(--link, #0070f3)",
          deep: "var(--link-deep, #0761d1)",
          soft: "var(--link-soft, #d3e5ff)",
        },

        brand: {
          violet: "#7928ca",
          cyan: "#50e3c2",
          pink: "#ff0080",
          magenta: "#eb367f",
        },

        gradient: {
          "develop-start": "#007cf0",
          "develop-end": "#00dfd8",
          "preview-start": "#7928ca",
          "preview-end": "#ff0080",
          "ship-start": "#ff4d4d",
          "ship-end": "#f9cb28",
        },

        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        input: "var(--input)",
        destructive: "var(--destructive)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Geist Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "monospace"],
      },

      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.3rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.6rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "6xl": ["3.75rem", { lineHeight: "1.05" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },

      maxWidth: {
        app: "1200px",
        content: "1200px",
      },

      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm, 6px)",
        md: "var(--radius-md, 12px)",
        lg: "var(--radius-lg, 16px)",
        "pill-category": "var(--radius-pill-category, 64px)",
        pill: "var(--radius-pill, 100px)",
        full: "var(--radius-full, 9999px)",
      },

      boxShadow: {
        whisper: "var(--shadow-whisper)",
        floating: "var(--shadow-floating)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },

      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
      },

      transitionProperty: {
        geist:
          "background-color,border-color,color,fill,stroke,opacity,box-shadow,transform,filter",
      },

      transitionTimingFunction: {
        geist: "cubic-bezier(0.4,0,0.2,1)",
      },

      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },

        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },

        fade: {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },

        "fade-up": {
          from: {
            opacity: "0",
            transform: "translateY(12px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        scale: {
          from: {
            opacity: "0",
            transform: "scale(.98)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },

      animation: {
        "accordion-down": "accordion-down .2s ease-out",
        "accordion-up": "accordion-up .2s ease-out",
        "caret-blink": "caret-blink 1.25s ease infinite",
        fade: "fade .4s ease",
        "fade-up": "fade-up .45s ease",
        scale: "scale .35s ease",
      },
    },
  },

  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar-hide"),
  ],
};