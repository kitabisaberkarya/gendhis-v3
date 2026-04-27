import React from 'react';

interface TextareaFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    helpText?: string;
    themeColor?: 'sky' | 'emerald' | 'violet';
}

const themeClasses = {
    sky: 'focus:ring-sky-500 focus:border-sky-500',
    emerald: 'focus:ring-emerald-500 focus:border-emerald-500',
    violet: 'focus:ring-violet-500 focus:border-violet-500',
};

const TextareaField: React.FC<TextareaFieldProps> = ({ label, name, value, onChange, placeholder, required = false, rows = 4, helpText, themeColor = 'sky' }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {label}
            </label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder || `Masukkan ${label.toLowerCase()}`}
                required={required}
                rows={rows}
                className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 dark:placeholder-slate-400 dark:text-white transition ${themeClasses[themeColor]}`}
            />
            {helpText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helpText}</p>}
        </div>
    );
};

export default TextareaField;
