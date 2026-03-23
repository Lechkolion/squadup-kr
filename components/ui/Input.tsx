import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
          {label}
        </label>
      )}
      <input ref={ref} className={cn('input', className)} {...props} />
      {error && <p className="text-xs text-[var(--pink)] font-mono">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-orbitron font-semibold text-[var(--text-dim)] tracking-wider uppercase">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'input resize-none',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--pink)] font-mono">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
