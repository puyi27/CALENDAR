import { useState } from 'react';

interface Option {
  value: any;
  label: string;
}

interface CustomSelectProps {
  value: any;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect = ({ value, onChange, options, placeholder, disabled, className = "h-12 text-sm" }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value));

  return (
    <div className="relative w-full">
      {isOpen && <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 w-full bg-base-100 rounded-xl border border-base-300 focus:outline-none font-medium shadow-sm transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-base-200' : 'hover:border-primary/50 cursor-pointer'} relative z-[10] ${className} ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={selectedOption ? 'text-base-content' : 'text-base-content/50'}>
            {selectedOption ? selectedOption.label : (placeholder || '---')}
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-2 shadow-2xl bg-base-100 border border-base-300 rounded-2xl w-full z-[110] max-h-60 overflow-y-auto animate-fade-in-up flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${String(value) === String(opt.value) ? 'bg-primary/10 text-primary' : 'text-base-content/70 hover:bg-primary/5 hover:text-primary hover:pl-5'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              <div className="w-4 flex justify-center shrink-0">
                {String(value) === String(opt.value) && <span className="text-primary text-lg leading-none">✓</span>}
              </div>
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
