import type { ReactNode } from "react";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Optional link rendered at the right of the head. */
  aside?: ReactNode;
}

export function SectionHead({ eyebrow, title, lede, aside }: SectionHeadProps) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {lede !== undefined ? <p className="section-lede">{lede}</p> : null}
      </div>
      {aside !== undefined ? <div>{aside}</div> : null}
    </div>
  );
}
