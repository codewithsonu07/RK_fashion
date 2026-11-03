import { useId, cloneElement, isValidElement } from 'react';

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-2 text-[13px] text-error" role="alert">
      {children}
    </p>
  );
}

/**
 * Label + control + hint/error. Wires the label to the single child control;
 * pass `id` (and the same id on the control) when the control is wrapped.
 */
export function Field({ id: fixedId, label, hint, error, children, className = '' }) {
  const generated = useId();
  const id = fixedId || generated;
  const control = !fixedId && isValidElement(children) ? cloneElement(children, { id: children.props.id || id }) : children;
  return (
    <div className={className}>
      <label htmlFor={id} className="label-caps block text-muted">
        {label}
      </label>
      {hint && <p className="mt-1 text-[12px] text-muted/80">{hint}</p>}
      <div className="mt-2">{control}</div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
