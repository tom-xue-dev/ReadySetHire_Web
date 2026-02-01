import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children?: ReactNode;
};

const baseClasses =
  'px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ' +
  'bg-blue-600 text-white hover:bg-blue-700';

export function Button({ className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={twMerge(baseClasses, className)}
    >
      {children}
    </button>
  );
}