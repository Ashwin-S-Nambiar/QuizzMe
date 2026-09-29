import { useId } from 'react';

export function Choice({
  name,
  checked,
  disabled,
  onSelect,
  className,
  children,
}) {
  return (
    <label
      className={`choice press ${className}`}
      data-disabled={disabled || undefined}
      data-on={checked || undefined}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
    </label>
  );
}

// A row of tactile chips; the chosen one is inked in lilac.
export default function Segmented({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
  tall = false,
}) {
  const id = useId();
  return (
    <fieldset className="min-w-0">
      <legend className={hideLabel ? 'sr-only' : 'caps mb-2'}>{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1.5">
        {options.map((o) => (
          <Choice
            key={o.value}
            name={id}
            checked={o.value === value}
            disabled={o.disabled}
            onSelect={() => onChange(o.value)}
            className={`tact chip flex min-w-0 flex-col items-center justify-center px-1.5 py-1 text-[0.95rem] ${tall ? 'h-13 short:h-11' : 'min-h-11'}`}
          >
            <span className="leading-tight">{o.label}</span>
            {o.hint != null && (
              <span className="font-sans text-[0.7rem] leading-tight font-medium opacity-70">
                {o.hint}
              </span>
            )}
          </Choice>
        ))}
      </div>
    </fieldset>
  );
}
