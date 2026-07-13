import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  show: boolean;
  message?: string;
}

export function ProcessingOverlay({ show, message = 'Processing authentication...' }: ProcessingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0B]/85 backdrop-blur-md transition-all">
      <div className="flex flex-col items-center p-8 rounded-2xl bg-[#111113] border border-white/[0.08] shadow-2xl">
        <Loader2 className="w-10 h-10 text-[#C6FF3D] animate-spin mb-4" />
        <h3 className="text-white font-semibold text-base mb-1">Please wait</h3>
        <p className="text-white/50 text-xs text-center max-w-xs">{message}</p>
      </div>
    </div>
  );
}
