import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        <Icon className="h-7 w-7 text-accent/60" />
      </div>
      <p className="mt-4 text-sm font-medium text-white">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-dim">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-accent/15 px-4 py-2 text-xs font-semibold text-accent transition-all duration-200 hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
