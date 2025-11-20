interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    wrapperClassName?: string;
  }
  
  export function Input({ label, className = "", wrapperClassName = "", ...props }: InputProps) {
    return (
      <div className={`flex flex-col gap-1 min-w-0 ${wrapperClassName}`}>
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          {...props}
          className={`
            border border-gray-300 
            rounded-lg px-4 py-2 
            focus:border-blue-500 
            outline-none 
            text-base
            w-full
            ${className}
          `}
        />
      </div>
    );
  }
  