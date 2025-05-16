import { cn } from "./cn";

export function Card({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-rokGrayBorder bg-rokGrayDark text-rokIvory shadow",
        className
      )}
    />
  );
}

export function CardContent({
  className = "",
  ...props
}: React.ComponentProps<"div">) {
  return <div {...props} className={cn("p-6", className)} />;
}
