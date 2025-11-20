interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = "" }: CardProps) {
    return (
      <div
        className={`
          bg-white 
          rounded-xl 
          shadow-md 
          p-10 
          max-w-md 
          w-full
          ${className}
        `}
      >
        {children}
      </div>
    );
  }