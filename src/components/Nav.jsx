import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Journey', icon: '🗺️' },
  { to: '/probability', label: 'Probabilidad', icon: '🎯' },
  { to: '/pool', label: 'Pool Sim', icon: '🏊' },
  { to: '/accounting', label: 'Contabilidad', icon: '📒' },
  { to: '/feeshare', label: 'Fee Share', icon: '💰' },
  { to: '/termsheet', label: 'Term Sheet', icon: '📄' },
]

export default function Nav() {
  const base = 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors'
  const active = `${base} bg-accent/15 text-accent font-semibold`
  const idle = `${base} text-text-dim hover:bg-card-hover hover:text-text`

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-card border-r border-border p-4 fixed left-0 top-0 z-40">
        <h1 className="text-lg font-bold text-text mb-1 px-2">StakeRaffle</h1>
        <p className="text-xs text-text-dim mb-6 px-2">Investor Hub</p>
        <nav className="flex flex-col gap-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => isActive ? active : idle}>
              <span>{l.icon}</span><span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex justify-around py-2 z-40">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 rounded ${isActive ? 'text-accent font-semibold' : 'text-text-dim'}`
            }
          >
            <span className="text-lg">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
