import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 border border-transparent transition-colors duration-200 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "data-[size=default]:h-5 data-[size=default]:w-9",
        "data-[size=sm]:h-4 data-[size=sm]:w-7",
        "data-[checked]:bg-foreground data-[unchecked]:bg-accent-2 dark:data-[unchecked]:bg-accent-3 border-border/60 data-[checked]:border-transparent",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          "group-data-[size=default]/switch:size-4",
          "group-data-[size=sm]/switch:size-3",
          "group-data-[size=default]/switch:group-data-[checked]/switch:translate-x-4",
          "group-data-[size=sm]/switch:group-data-[checked]/switch:translate-x-3",
          "group-data-[unchecked]/switch:translate-x-0",
          "bg-background group-data-[checked]/switch:dark:bg-background group-data-[unchecked]/switch:dark:bg-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
