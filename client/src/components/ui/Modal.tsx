import type { ReactNode } from "react";

export default function Modal({ open, title, onClose, children }: { open: boolean; title?: string; onClose: () => void; children: ReactNode; }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 'min(720px, 92vw)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}
