import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  id?: string;
}

/** Comma / Enter separated tag list (project technologies, service deliverables). */
export function TagInput({ value, onChange, placeholder = "Type and press Enter", id }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const parts = draft
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part !== "" && !value.includes(part));
    if (parts.length > 0) onChange([...value, ...parts]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="tag-input" onClick={() => document.getElementById(id ?? "")?.focus()}>
      {value.map((tag) => (
        <span className="tag-chip" key={tag}>
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))}>
            <X size={11} aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ""}
        aria-label={placeholder}
      />
    </div>
  );
}
