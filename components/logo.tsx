import { cn } from "@/lib/utils";

export function Logo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-bg shadow-[0_0_24px_-4px_rgba(198,255,61,0.6)]", className)}
      style={style}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 18L10 6L14 14L17 9L20 18"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
