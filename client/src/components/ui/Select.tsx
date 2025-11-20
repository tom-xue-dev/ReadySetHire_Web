interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
  }
  
  export function Select({ label, className = "", children, ...props }: SelectProps) {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <select
          {...props}
          className={`
            border border-gray-300 rounded-lg px-4 py-2 
            bg-white cursor-pointer text-base
            focus:border-blue-500 outline-none
            ${className}
          `}
        >
          {children}
        </select>
      </div>
    );
  }
  