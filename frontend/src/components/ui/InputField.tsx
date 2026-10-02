import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  className = '',
  type,
  maxLength,
  onInput,
  id,
  required,
  ...props
}) => {
  const isNumberWrapper = type === 'number';
  const inputId = id || props.name;

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (isNumberWrapper) {
      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
    }
    if (maxLength && e.currentTarget.value.length > maxLength) {
      e.currentTarget.value = e.currentTarget.value.slice(0, maxLength);
    }
    if (onInput) onInput(e as any);
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        required={required}
        type={isNumberWrapper ? 'text' : type}
        inputMode={isNumberWrapper ? 'numeric' : props.inputMode}
        maxLength={maxLength}
        onInput={handleInput}
        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all outline-hidden ${
          error
            ? 'border-red-500 bg-red-50/30 text-red-900 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:border-blue-600'
        } ${className}`}
      />

      {error && (
        <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
};
