import { motion } from 'motion/react';
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

export default function Segmented({ label, value, options, onChange }) {
  const id = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="eyebrow mb-2">{label}</legend>
      <div className="relative grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-surface p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Choice
              key={o.value}
              name={id}
              checked={active}
              disabled={o.disabled}
              onSelect={() => onChange(o.value)}
              className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-sm font-medium outline-offset-0 disabled:opacity-35 ${
                active ? 'text-ink' : 'text-muted hover-fine:text-ink-2'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={id}
                  transition={{ type: 'spring', duration: 0.32, bounce: 0.12 }}
                  className="glass absolute inset-0 rounded-xl"
                />
              )}
              <span className="relative leading-tight">{o.label}</span>
              {o.hint != null && (
                <span className="relative font-mono text-[0.68rem] leading-tight text-muted tabular-nums">
                  {o.hint}
                </span>
              )}
            </Choice>
          );
        })}
      </div>
    </fieldset>
  );
}
