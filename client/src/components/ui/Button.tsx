import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children?: ReactNode;
};

export function Button({ className = "", children, ...props }: ButtonProps) {
    return (
      <button
        {...props}
        className={`
          px-4 py-2 
          rounded-lg 
          bg-blue-600 
          text-white 
          font-medium
          hover:bg-blue-700
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${className}
        `}
      >
        {children}
      </button>
    );
  }
  