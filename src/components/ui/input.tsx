import { cn } from "./cn";

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-rokGrayBorder bg-rokGrayInput px-3 text-sm placeholder-rokGraySubtle focus:outline-none focus:ring-2 focus:ring-rokPurple",
        className
      )}
    />
  );
}
