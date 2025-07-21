import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva("rounded-lg border shadow-sm transition-all duration-300", {
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      gradient: "bg-gradient-to-br from-primary-900/20 to-secondary-900/20 border-primary-500/30",
      glass: "bg-white/10 backdrop-blur-lg border-white/20",
      outline: "bg-transparent border-primary-500/50",
    },
    hover: {
      none: "",
      lift: "hover:-translate-y-1 hover:shadow-md",
      glow: "hover:shadow-[0_0_15px_rgba(105,65,232,0.3)]",
      scale: "hover:scale-[1.02]",
    },
    animation: {
      none: "",
      pulse: "animate-pulse",
      fadeIn: "animate-fadeIn",
      slideIn: "animate-slideIn",
    },
  },
  defaultVariants: {
    variant: "default",
    hover: "none",
    animation: "none",
  },
})

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

function EnhancedCard({ className, variant, hover, animation, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, hover, animation }), className)} {...props} />
}

const EnhancedCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
)
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
)
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
)
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
}

