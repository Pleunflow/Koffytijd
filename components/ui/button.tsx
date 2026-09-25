import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// shadcn-Button in de stijl van de Toppy DS-Button: pill, Poppins SemiBold,
// geel met ink-tekst als primaire CTA, scale(.97) bij indrukken.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold leading-none whitespace-nowrap border-2 transition-[background-color,transform,border-color] duration-[120ms] ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-toppy-yellow text-toppy-ink border-transparent hover:bg-toppy-yellow-deep",
        secondary: "bg-toppy-ink text-white border-toppy-ink hover:bg-toppy-ink-hover",
        outline:
          "bg-transparent text-toppy-ink border-toppy-grey-light hover:bg-toppy-grey-lighter",
        ghost: "bg-transparent text-toppy-ink border-transparent hover:bg-toppy-grey-lighter",
      },
      size: {
        sm: "min-h-9 px-[0.9rem] py-[0.4rem] text-sm",
        md: "min-h-11 px-[1.3rem] py-[0.6rem] text-base",
        lg: "min-h-[54px] gap-2.5 px-[1.8rem] py-[0.85rem] text-[1.0625rem]",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
