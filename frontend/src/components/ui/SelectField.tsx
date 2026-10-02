import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  error,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      <select
        {...props}
        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all outline-none ${
          error
            ? 'border-red-500 bg-red-50/30 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-brand-accent'
        } ${className}`}
      >
        {children}
      </select>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};