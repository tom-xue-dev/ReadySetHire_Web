export function Centered({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        {children}
      </div>
    );
  }
  