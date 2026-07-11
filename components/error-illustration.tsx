import { cn } from "@/lib/utils";

export function ErrorIllustration({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div className={cn("relative mb-8", className)}>
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-white/[0.03] border border-white/[0.06] shadow-[0_0_60px_-12px_rgba(198,255,61,0.15)]">
        <span className="text-5xl font-black text-accent/20 tracking-tighter select-none">
          {code}
        </span>
      </div>
      <div className="absolute inset-0 mx-auto h-28 w-28 rounded-3xl bg-accent/5 blur-2xl" />
    </div>
  );
}
