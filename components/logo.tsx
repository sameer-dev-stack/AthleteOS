import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-bg shadow-[0_0_24px_-4px_rgba(198,255,61,0.6)]", className)} style={style}>
      <Image src="/apple-icon.png" alt="NIL CARD" width={32} height={32} className="h-4 w-4 object-contain" />
    </div>
  );
}
