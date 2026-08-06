import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: number;
  label: string;
}

interface Props {
  options: Option[];
  value: number | '';
  onChange: (val: number | '') => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableSelect({ options, value, onChange, placeholder, required }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = options.find(o => o.value === value);
    if (selected) {
      setSearch(selected.label);
    } else {
      setSearch('');
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selected = options.find(o => o.value === value);
        if (selected) setSearch(selected.label);
        else setSearch('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); onChange(''); }}
        onFocus={() => setIsOpen(true)}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-600 focus:ring-blue-600"
        placeholder={placeholder || 'Search...'}
        required={required && !value}
      />
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {filtered.length === 0 ? (
            <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900">No results found</li>
          ) : (
            filtered.map(opt => (
              <li
                key={opt.value}
                className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-blue-600 hover:text-white"
                onClick={() => {
                  onChange(opt.value);
                  setSearch(opt.label);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
