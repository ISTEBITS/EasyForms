import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-sans font-medium rounded-sm border border-transparent transition-all duration-150 outline-none select-none focus-visible:ring-1 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background border-transparent hover:bg-accent-7 active:scale-[0.98]",
        primary: "bg-foreground text-background border-transparent hover:bg-accent-7 active:scale-[0.98]",
        secondary: "bg-background text-foreground border-border hover:bg-accent-1 hover:border-accent-6 active:scale-[0.98]",
        outline: "bg-background text-foreground border-border hover:bg-accent-1 hover:border-accent-6 active:scale-[0.98]",
        ghost: "bg-transparent text-accent-6 hover:bg-accent-1 hover:text-foreground",
        destructive: "bg-error/15 text-error border-error/30 hover:bg-error/25 active:scale-[0.98]",
        link: "text-foreground underline-offset-4 hover:underline border-transparent bg-transparent",
        pill: "bg-foreground text-background border-transparent rounded-pill hover:bg-accent-7 active:scale-[0.98]",
        "pill-secondary": "bg-background text-foreground border-border rounded-pill hover:bg-accent-1 hover:border-accent-6 active:scale-[0.98]",
        category: "bg-background text-foreground border-border rounded-pill-category hover:bg-accent-1 hover:border-accent-6 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 text-sm gap-2",
        xs: "h-7 px-2 text-xs gap-1.5 rounded-xs",
        sm: "h-8 px-3 text-xs gap-1.5 tracking-tight rounded-sm",
        md: "h-9 px-4 text-sm gap-2 rounded-sm",
        lg: "h-10 px-5 text-sm gap-2 rounded-sm",
        "pill-lg": "h-11 px-5 text-base gap-2 rounded-pill font-medium",
        "pill-md": "h-9 px-4 text-sm gap-2 rounded-pill font-medium",
        icon: "size-9 rounded-sm",
        "icon-xs": "size-7 rounded-xs",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-10 rounded-sm",
        "icon-circular": "size-9 rounded-full border border-border bg-background hover:bg-accent-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

