import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import SliderInput from '../components/shared/SliderInput'
import MetricCard from '../components/shared/MetricCard'
import HlBox from '../components/shared/HlBox'

const fmt = (n, d = 6) => {
  if (n === 0) return '0'
  if (n < 0.000001) return n.toExponential(4)
  if (n < 1) return n.toFixed(d)
  if (n >= 1e6) return n.toLocaleString('en', { maximumFractionDigits: 2 })
  return n.toFixed(Math.min(d, 4))
}

export default function TicketProbability() {
  const [userA, setUserA] = useState(120)
  const [userB, setUserB] = useState(0.001)
  const [pool, setPool] = useState(0)
  const [prize, setPrize] = useState(15.42)

  const eligible = userA + userB + pool
  const pA = eligible > 0 ? userA / eligible : 0
  const pB = eligible > 0 ? userB / eligible : 0
  const pPool = eligible > 0 ? pool / eligible : 0

  const evA = pA * prize
  const evB = pB * prize
  const evAnnualA = evA * 365
  const evAnnualB = evB * 365
  const waitA = pA > 0 ? 1 / pA : Infinity
  const waitB = pB > 0 ? 1 / pB : Infinity

  const stakingApyA = userA * 0.025
  const stakingApyB = userB * 0.025

  const startA = 0
  const endA = userA
  const startB = userA
  const endB = userA + userB

  const barData = [
    { name: 'Usuario A', value: pA * 100, fill: '#3b82f6' },
    { name: 'Usuario B', value: pB * 100, fill: '#ef4444' },
    { name: 'Pool (otros)', value: pPool * 100, fill: '#64748b' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Probabilidad por balance — intervalo ponderado</h2>
      <p className="text-text-dim text-sm mb-6">Seleccion proporcional — spec &sect;8 stakeraffle-v1.md</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sliders */}
        <div className="bg-card rounded-xl p-5 border border-border lg:col-span-1">
          <h3 className="text-sm font-semibold text-text-dim uppercase mb-4">Parametros</h3>
          <SliderInput label="Usuario A" value={userA} onChange={setUserA} min={0.001} max={10000} step={0.1} unit="ETH" />
          <SliderInput label="Usuario B" value={userB} onChange={setUserB} min={0.0001} max={100} step={0.0001} unit="ETH" />
          <SliderInput label="Pool adicional (otros)" value={pool} onChange={setPool} min={0} max={500000} step={100} unit="ETH" />
          <SliderInput label="Premio estimado" value={prize} onChange={setPrize} min={0.01} max={1000} step={0.01} unit="ETH" />
        </div>

        {/* Charts + metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stacked bar */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">% del Eligible Supply</h3>
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={[{ a: pA * 100, b: pB * 100, p: pPool * 100 }]} layout="vertical" barSize={28}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip formatter={v => `${v.toFixed(6)}%`} />
                <Bar dataKey="a" stackId="s" fill="#3b82f6" name="Usuario A" radius={[4, 0, 0, 4]} />
                <Bar dataKey="b" stackId="s" fill="#ef4444" name="Usuario B" />
                <Bar dataKey="p" stackId="s" fill="#64748b" name="Pool" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interval visual */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Intervalo en la recta numerica (0 — {fmt(eligible, 2)} ETH)</h3>
            <div className="relative h-8 bg-bg rounded-full overflow-hidden">
              <div className="absolute h-full bg-accent/70 rounded-l-full" style={{ left: '0%', width: `${pA * 100}%` }} />
              <div className="absolute h-full bg-red/70" style={{ left: `${pA * 100}%`, width: `${pB * 100}%` }} />
              <div className="absolute h-full bg-text-dim/30 rounded-r-full" style={{ left: `${(pA + pB) * 100}%`, width: `${pPool * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-text-dim mt-1">
              <span>0</span>
              <span>{fmt(eligible, 2)}</span>
            </div>
          </div>

          {/* Probability cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <UserCard
              name="Usuario A"
              color="text-accent"
              balance={userA}
              prob={pA}
              start={startA}
              end={endA}
              ev={evA}
              evAnnual={evAnnualA}
              wait={waitA}
              stakingApy={stakingApyA}
              prize={prize}
            />
            <UserCard
              name="Usuario B"
              color="text-red"
              balance={userB}
              prob={pB}
              start={startB}
              end={endB}
              ev={evB}
              evAnnual={evAnnualB}
              wait={waitB}
              stakingApy={stakingApyB}
              prize={prize}
            />
          </div>

          {/* Distribution chart */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Distribucion del Pool</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" />
                <Tooltip formatter={v => `${v.toFixed(6)}%`} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Highlight box */}
          <HlBox color="border-amber">
            <p className="text-sm font-semibold text-amber mb-1">Nota: Intervalos continuos, no tickets discretos</p>
            <p className="text-xs text-text-dim">
              StakeRaffle NO genera tickets discretos. Cada participante posee un <strong>intervalo continuo</strong> en
              la recta [0, eligibleSupply). Un numero aleatorio cae en el intervalo de un usuario con probabilidad
              exactamente proporcional a su balance elegible. Esto elimina errores de redondeo y garantiza equidad
              matematica independientemente del tamano del deposito.
            </p>
          </HlBox>
        </div>
      </div>
    </div>
  )
}

function UserCard({ name, color, balance, prob, start, end, ev, evAnnual, wait, stakingApy }) {
  const evDiff = evAnnual - stakingApy
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h4 className={`font-semibold mb-3 ${color}`}>{name} — {fmt(balance, 4)} ETH</h4>
      <div className="space-y-2 text-sm">
        <Row label="Probabilidad de ganar" value={`${fmt(prob * 100)}%`} />
        <Row label="Intervalo" value={`[${fmt(start, 4)}, ${fmt(end, 4)})`} />
        <Row label="EV por ronda" value={`${fmt(ev)} ETH`} />
        <Row label="EV anual (365 rondas)" value={`${fmt(evAnnual)} ETH`} />
        <Row label="Espera promedio" value={wait === Infinity ? '∞' : `${fmt(wait, 1)} rondas`} />
        <div className="border-t border-border pt-2 mt-2">
          <Row label="Staking puro 2.5% APY" value={`${fmt(stakingApy)} ETH/ano`} />
          <Row
            label="Diferencia EV vs staking"
            value={`${evDiff >= 0 ? '+' : ''}${fmt(evDiff)} ETH`}
            valueColor={evDiff >= 0 ? 'text-green' : 'text-red'}
          />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, valueColor = 'text-text' }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-dim">{label}</span>
      <span className={`font-mono ${valueColor}`}>{value}</span>
    </div>
  )
}
