export default function SliderInput({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-text-dim">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
            }}
            min={min}
            max={max}
            step={step}
            className="w-24 bg-bg border border-border rounded px-2 py-1 text-sm text-right text-text focus:border-accent focus:outline-none"
          />
          {unit && <span className="text-xs text-text-dim">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  )
}
