
import React from 'react';

interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    themeColor?: 'sky' | 'emerald' | 'violet' | 'rose';
}

const themeClasses = {
    sky: 'focus:ring-sky-500 focus:border-sky-500',
    emerald: 'focus:ring-emerald-500 focus:border-emerald-500',
    violet: 'focus:ring-violet-500 focus:border-violet-500',
    rose: 'focus:ring-rose-500 focus:border-rose-500',
};

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, placeholder, required = false, type = 'text', themeColor = 'sky' }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {label}
            </label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder || `Masukkan ${label.toLowerCase()}`}
                required={required}
                className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 dark:placeholder-slate-400 dark:text-white transition ${themeClasses[themeColor]}`}
            />
        </div>
    );
};

export default InputField;