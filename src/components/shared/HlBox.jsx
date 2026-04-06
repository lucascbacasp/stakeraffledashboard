export default function HlBox({ children, color = 'border-accent' }) {
  return (
    <div className={`bg-card rounded-xl p-4 border-l-4 ${color} border border-border`}>
      {children}
    </div>
  )
}
