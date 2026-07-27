import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "gold" | "ghost" | "inverse";

interface BaseProps {
  variant?: Variant;
  className?: string;
}

interface ButtonProps extends BaseProps, ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface LinkButtonProps extends BaseProps {
  href: string;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-gold border border-primary",
  secondary:
    "bg-transparent text-on-surface border border-primary hover:bg-primary hover:text-on-primary",
  gold: "bg-gold text-on-primary border border-gold hover:opacity-90",
  ghost: "bg-transparent text-on-surface hover:text-gold border border-transparent",
  inverse:
    "bg-transparent text-on-primary border border-on-primary backdrop-blur-sm hover:bg-on-primary hover:text-primary",
};

const base =
  "inline-flex items-center justify-center gap-2 px-8 py-3.5 label-caps transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button ref={ref} className={`${base} ${variantClasses[variant]} ${className}`} {...props} />
  )
);
Button.displayName = "Button";

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={`${base} ${variantClasses[variant]} ${className}`}>
      {children}
    </Link>
  );
}
