import { cn } from "./cn";

/* ---------------------------------------------------------------------------
   Minimal, headless Select primitives so the Dashboard compiles.
   No pop-up logic yet; you can add radix-popover or headless-ui later.
---------------------------------------------------------------------------*/

/** Root wrapper — accepts value/onValueChange for type-safety only */
type SelectProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function Select({
  className = "",
  value,
  onValueChange,
  ...props
}: SelectProps) {
  return (
    <div
      {...props}
      className={cn("relative inline-block w-full", className)}
      data-value={value ?? ""}
    />
  );
}

/* ───────────────────────── Trigger (clickable head) ─────────────────────── */
export function SelectTrigger({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-rokGrayBorder bg-rokGrayInput",
        "px-3 text-sm flex items-center justify-between",
        className
      )}
    />
  );
}

/* ─────────────────────── Dropdown container (menu) ──────────────────────── */
export function SelectContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "absolute mt-1 w-full rounded-lg border border-rokGrayBorder",
        "bg-rokGrayInput py-1 shadow-lg z-20",
        className
      )}
    />
  );
}

/* ───────────────────────────── Option row ───────────────────────────────── */
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

/* ──────────────────────── Value (selected text) ─────────────────────────── */
type SelectValueProps = {
  children?: React.ReactNode;
  placeholder?: string;
};

export function SelectValue({ children, placeholder }: SelectValueProps) {
  return (
    <span className={cn(!children && "text-rokGraySubtle")}>
      {children ?? placeholder}
    </span>
  );
}
