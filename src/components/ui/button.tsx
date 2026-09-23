import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,box-shadow,color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        tape:
          "rounded-full border-[3px] border-ink bg-gold font-display font-semibold text-ink shadow-paper hover:-translate-y-px",
        ink: "rounded-full border-[3px] border-ink bg-card font-display font-semibold text-ink shadow-paper",
        ghost: "rounded-full font-display text-muted hover:text-ink",
        danger:
          "rounded-full border-[3px] border-ink bg-card font-display font-semibold text-seal hover:bg-paper-deep",
      },
      size: {
        sm: "h-10 min-h-10 px-3 text-sm",
        md: "h-11 min-h-11 px-4 text-sm",
        lg: "h-12 min-h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "tape",
      size: "md",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
