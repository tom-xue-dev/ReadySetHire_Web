import type { ReactNode } from "react";

export function DetailPanel({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl flex flex-col" role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="truncate text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100" aria-label="Close preview">×</button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex gap-2 border-t px-5 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}

