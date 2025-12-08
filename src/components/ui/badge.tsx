import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Premium variants
        hot: "border-transparent bg-gradient-primary text-primary-foreground animate-glow-pulse",
        vip: "border-transparent bg-gradient-accent text-accent-foreground",
        success: "border-transparent bg-success/20 text-success border-success/30",
        warning: "border-transparent bg-warning/20 text-warning border-warning/30",
        soldOut: "border-transparent bg-destructive/20 text-destructive border-destructive/30",
        limited: "border-transparent bg-warning/20 text-warning border-warning/30",
        earlyBird: "border-transparent bg-accent/20 text-accent border-accent/30",
        featured: "border-primary/30 bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
