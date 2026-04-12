import React from 'react';
import './LiteSelect.css';

export interface LiteSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface LiteSelectProps {
  value?: string;
  defaultValue?: string;
  options: LiteSelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface LiteMultiSelectProps {
  value: string[];
  options: LiteSelectOption[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const mergeClassName = (base: string, className?: string) =>
  className ? `${base} ${className}` : base;

const LiteSelect = ({
  value,
  defaultValue,
  options,
  onChange,
  placeholder,
  allowClear,
  disabled,
  className,
  style,
}: LiteSelectProps) => (
  <div className={mergeClassName('lite-select-shell', className)} style={style}>
    <select
      className={`lite-select ${!value ? 'is-placeholder' : ''}`}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {placeholder || allowClear ? (
        <option value="">
          {placeholder ?? '请选择'}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const LiteMultiSelect = ({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  className,
  style,
}: LiteMultiSelectProps) => {
  const selected = new Set(value);

  const toggle = (nextValue: string) => {
    if (disabled) {
      return;
    }

    if (selected.has(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  return (
    <div className={mergeClassName('lite-multi-select', className)} style={style}>
      {options.map((option) => {
        const active = selected.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`lite-multi-select__tag ${active ? 'is-active' : ''}`}
            disabled={disabled || option.disabled}
            onClick={() => toggle(option.value)}
          >
            {option.label}
          </button>
        );
      })}
      {value.length === 0 ? (
        <div className="lite-multi-select__placeholder">
          {placeholder ?? '请选择'}
        </div>
      ) : null}
    </div>
  );
};

export default LiteSelect;
