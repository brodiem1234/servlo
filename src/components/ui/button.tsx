import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: WHITE background, BLACK text (dark-mode launch spec)
        default: "bg-white text-black hover:bg-neutral-100",
        // Secondary: transparent with white border + white text
        secondary: "border border-white bg-transparent text-white hover:bg-neutral-900",
        // Outline: same visual as secondary
        outline: "border border-white bg-transparent text-white hover:bg-neutral-900",
        // Ghost: just hover state, white text on transparent
        ghost: "text-white hover:bg-neutral-900",
        // Destructive: red bg, white text
        destructive: "bg-red-600 text-white hover:bg-red-700",
        // Dark-ghost retained for back/cancel buttons on dark surfaces
        "dark-ghost":
          "border border-neutral-700 bg-transparent text-white hover:bg-neutral-900 hover:border-neutral-500"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };


