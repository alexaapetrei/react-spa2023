import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm border border-transparent text-[12px] font-medium uppercase tracking-[0.16em] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#b01e0a]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-[#d13427]",
        outline:
          "border-foreground bg-background text-foreground hover:border-[#3860be] hover:text-[#3860be]",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-[#181818] dark:hover:bg-white/90 dark:hover:text-[#181818]",
        ghost: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "border-transparent p-0 text-foreground underline-offset-4 hover:text-[#3860be] hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-3",
        sm: "min-h-9 px-3 py-2",
        lg: "min-h-12 px-8 py-3",
        icon: "h-11 w-11 px-0 py-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
