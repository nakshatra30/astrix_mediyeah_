const STEPS = [
  {
    title: "Discover",
    text: "We start with your goal, not our template. Stakeholder interviews, audience mapping, and a technical audit set the direction before a single pixel is drawn.",
  },
  {
    title: "Design",
    text: "Wireframes become high-fidelity prototypes you can click through. Motion, type, and interaction are designed against your brand — reviewed together, early and often.",
  },
  {
    title: "Build",
    text: "Production code ships in short cycles behind a preview URL, so you watch the build come together. Clean architecture, real content, no placeholder debt.",
  },
  {
    title: "Launch",
    text: "Performance budgets, accessibility passes, analytics, and search readiness are verified before go-live. Launch day is boring — exactly as it should be.",
  },
  {
    title: "Grow",
    text: "Post-launch we measure what matters, iterate on evidence, and keep the platform evolving with your business through retained support.",
  },
];

export function ProcessTimeline() {
  return (
    <div className="timeline">
      {STEPS.map((step, index) => (
        <div className="timeline-step" key={step.title}>
          <div className="timeline-node">{String(index + 1).padStart(2, "0")}</div>
          <div>
            <h3 className="timeline-title">{step.title}</h3>
            <p className="timeline-text">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
