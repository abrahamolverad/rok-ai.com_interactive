import { cn } from "./cn";

export function SelectTrigger({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-rokGrayBorder bg-rokGrayInput px-3 text-sm flex items-center justify-between",
        className
      )}
    />
  );
}

export function SelectContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "absolute mt-1 w-full rounded-lg border border-rokGrayBorder bg-rokGrayInput py-1 shadow-lg z-20",
        className
      )}
    />
  );
}

export function SelectItem({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "block w-full text-left px-3 py-2 text-sm hover:bg-rokGrayBorder",
        className
      )}
    />
  );
}

export function SelectValue({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}
// -----------------------------------------------------------------------------
//  Simple wrapper so `import { Select, … }` works
// -----------------------------------------------------------------------------
export function Select({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div
        {...props}
        className={cn("relative inline-block w-full", className)}
      />
    );
  }
  