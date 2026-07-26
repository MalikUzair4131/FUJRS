type BadgeVariant = "dark" | "gold" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  dark: "bg-primary text-on-primary",
  gold: "bg-gold text-on-primary",
  outline: "bg-transparent text-on-surface border border-outline-variant",
};

export function Badge({
  children,
  variant = "dark",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-label-sm font-body font-medium uppercase tracking-wide ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
