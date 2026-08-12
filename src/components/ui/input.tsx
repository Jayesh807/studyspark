import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "input-glow file:text-foreground placeholder:text-slate-400/70 selection:bg-[#7C4DFF] selection:text-white flex h-9 w-full min-w-0 !rounded-[12px] !border !border-white/[0.08] !bg-[#25243B] px-3 py-1 text-base !text-slate-100 shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:!border-[#7C4DFF] focus-visible:!ring-[#7C4DFF]/35 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
