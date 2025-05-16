import { cn } from "./cn";

/* ---------------------------------------------------------------------------
   Minimal headless-UI Select primitives so the Dashboard can compile.
   They accept the same props the page already passes but don't implement
   open/close logic—you can layer a real menu library later.
---------------------------------------------------------------------------*/

type SelectProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

export function Select({
  className = "",
  value,           // accepted for TS-type safety
  onValueChange,   // accepted for TS-type safety
  ...props
}: SelectProps) {
  return (
    <div
      {...props}
      className={cn("relative inline-block w-full", className)}
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

/* ──────────────────────── Dropdown container ─────────────────────────────── */
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

/* ───────────────────────────── Option row ────────────────────────────────── */
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

/* ───────────────────────────── Value text ────────────────────────────────── */
export function SelectValue({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}
