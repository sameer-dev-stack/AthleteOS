import { Sparkles } from 'lucide-react';

interface ReferralInviteBannerProps {
  referrerName?: string;
}

export function ReferralInviteBanner({ referrerName = 'Maya Reyes' }: ReferralInviteBannerProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/20 text-[#C6FF3D] text-xs font-medium">
      <Sparkles className="w-4 h-4 shrink-0" />
      <span>
        <strong>{referrerName}</strong> invited you to claim your free athlete card & unlock 7 days of Pro free.
      </span>
    </div>
  );
}
