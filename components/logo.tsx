import { cn } from "@/lib/utils";

export function Logo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("relative flex h-8 w-8 items-center justify-center", className)} style={style}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 180 180"
        width="32"
        height="32"
        className="h-8 w-8"
      >
        <rect width="180" height="180" rx="40" fill="#000000" />
        <text x="90" y="118" fontFamily="Arial, sans-serif" fontSize="100" fontWeight="bold" fill="#C6FF3D" textAnchor="middle">N</text>
      </svg>
    </div>
  );
}
