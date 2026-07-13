import { Zap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export function Logo({ size = 'md', showWordmark = true }: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative flex items-center justify-center rounded-xl bg-[#C6FF3D] text-[#0A0A0B] shadow-[0_0_20px_rgba(198,255,61,0.25)] ${iconSizes[size]}`}>
        <Zap className="w-4 h-4 fill-current stroke-none" />
      </div>
      {showWordmark && (
        <span className={`font-bold tracking-tight text-white ${textSizes[size]}`}>
          Athlete<span className="text-[#C6FF3D]">OS</span>
        </span>
      )}
    </div>
  );
}
