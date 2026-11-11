export interface StatItem {
  value: string;
  label: string;
}

/** Real numbers only — counts come from the API, never invented. */
export function StatsStrip({ stats }: { stats: StatItem[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="stats-strip">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <p className="stat-value">{stat.value}</p>
          <p className="stat-label">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
