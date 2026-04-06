export default function MetricCard({ label, value, sub, color = 'text-accent' }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <p className="text-text-dim text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-text-dim text-xs mt-1">{sub}</p>}
    </div>
  )
}
