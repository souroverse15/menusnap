import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

const Button = forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      disabled = false,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      loading && "cursor-not-allowed",
      className
    );

    // If asChild is true, clone the child element with our classes
    if (asChild && children) {
      return React.cloneElement(children, {
        className: cn(classes, children.props?.className),
        ref,
        ...props,
      });
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" className="mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
