interface SwitchFieldProps {
  id: string;
  /** Field legend shown above the control (e.g. "Visibility"). */
  legend: string;
  /** Text beside the toggle (e.g. "Show publicly"). */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Field-labelled toggle switch. The 44x24 toggle and its text sit on one
 * flex row, vertically centred, so it aligns with sibling Field inputs —
 * the text must never live inside the fixed-size `.switch` box itself.
 */
export function SwitchField({ id, legend, label, checked, onChange }: SwitchFieldProps) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {legend}
      </label>
      <label className="switch-row" htmlFor={id}>
        <span className="switch">
          <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          <span className="switch-track" aria-hidden="true" />
        </span>
        <span className="switch-text">{label}</span>
      </label>
    </div>
  );
}
