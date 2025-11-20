import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent } from 'react';

type ListSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
};

export function ListSearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  onClear,
  className = '',
}: ListSearchBarProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  function handleClear() {
    if (!value) return;
    onChange('');
    if (onClear) onClear();
  }

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      <input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}


