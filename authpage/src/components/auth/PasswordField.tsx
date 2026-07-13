import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import type { ChangeEvent } from 'react';

interface PasswordFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function PasswordField({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••••••',
  autoComplete = 'current-password',
  label = 'Password',
  required = true,
  error,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-medium text-white/80 tracking-wide uppercase">
            {label}
          </label>
        </div>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
          <Lock className="w-4 h-4" />
        </div>
        <input
          type={isVisible ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full pl-10 pr-11 py-3 bg-[#111113] border ${
            error ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-[#C6FF3D]'
          } rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-[#C6FF3D]/50 transition-all`}
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
