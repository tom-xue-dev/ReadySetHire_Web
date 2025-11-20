import type { ReactNode } from 'react';

type PageShellProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function PageShell({ title, subtitle, icon, right, children, className }: PageShellProps) {
  return (
    <section className={`min-h-screen bg-transparent max-w-7xl mx-auto ${className || ''}`}>
      {(title || right) && (
        <div className="flex items-center gap-3 mb-4 pt-1">
          <div className="flex items-center gap-2 text-gray-800 min-h-[28px]">
            {icon}
            {title && (
              <div>
                <h1 className="text-xl font-semibold m-0 leading-tight">{title}</h1>
                {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
              </div>
            )}
          </div>
          <div className="flex-1" />
          {right}
        </div>
      )}
      {children}
    </section>
  );
}


