import { cn } from "./cn";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const base =
    "h-10 px-4 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-60";
  const style =
    variant === "secondary"
      ? "border border-rokGrayBorder bg-transparent hover:bg-rokGrayInput"
      : "bg-rokPurple text-white hover:bg-purple-600";
  return <button {...props} className={cn(base, style, className)} />;
}
