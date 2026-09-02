import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-7 shrink-0 overflow-hidden rounded-full font-sans select-none items-center justify-center font-medium text-xs shadow-2xs",
        className
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  src,
  alt = "",
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full text-xs font-semibold uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
