'use client'
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
        outline: "border-2 border-gray-600 bg-transparent text-gray-200 hover:bg-gray-800 hover:text-white dark:border-gray-400 dark:text-gray-200 dark:hover:bg-gray-700",
        secondary: "bg-gray-700 text-gray-200 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600",
        ghost: "text-gray-300 hover:bg-gray-800 hover:text-white dark:text-gray-300 dark:hover:bg-gray-700",
        link: "text-blue-500 underline-offset-4 hover:underline dark:text-blue-400",
        social: "bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700/50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50 w-full justify-start gap-3 px-4 py-2.5"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        full: "w-full px-4 py-2.5"
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };