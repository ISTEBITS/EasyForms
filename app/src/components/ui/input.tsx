import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-sans placeholder:text-accent-4 text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium transition-all duration-150 focus-visible:outline-none focus-visible:border-accent-8 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }

