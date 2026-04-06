import { useState } from 'react'
import SliderInput from '../components/shared/SliderInput'

const fmt = (n, d = 6) => {
  if (n === 0) return '0'
  if (n < 0.000001) return n.toExponential(4)
  if (n < 1) return n.toFixed(d)
  return n.toLocaleString('en', { maximumFractionDigits: 4 })
}

const TABS = ['Deposito', 'Durante ronda', 'Cierre → minting', 'Reclamo', 'Solvencia']

function BalanceBar({ label, spETH, rafETH, maxVal }) {
  const w1 = maxVal > 0 ? (spETH / maxVal) * 100 : 0
  const w2 = maxVal > 0 ? (rafETH / maxVal) * 100 : 0
  return (
    <div className="mb-4">
      <p className="text-xs text-text-dim mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-text-dim uppercase mb-1">Activos (spETH)</p>
          <div className="h-6 bg-bg rounded overflow-hidden">
            <div className="h-full bg-accent/70 rounded" style={{ width: `${Math.min(w1, 100)}%` }} />
          </div>
          <p className="text-xs font-mono mt-0.5">{fmt(spETH)} spETH</p>
        </div>
        <div>
          <p className="text-[10px] text-text-dim uppercase mb-1">Pasivos (rafETH)</p>
          <div className="h-6 bg-bg rounded overflow-hidden">
            <div className="h-full bg-amber/70 rounded" style={{ width: `${Math.min(w2, 100)}%` }} />
          </div>
          <p className="text-xs font-mono mt-0.5">{fmt(rafETH)} rafETH</p>
        </div>
      </div>
    </div>
  )
}

export default function PrizeAccounting() {
  const [userA, setUserA] = useState(120)
  const [userB, setUserB] = useState(0.001)
  const [apy, setApy] = useState(2.5)
  const [feeProto, setFeeProto] = useState(10)
  const [winner, setWinner] = useState('A')
  const [tab, setTab] = useState(0)

  const totalDeposit = userA + userB
  const dailyYield = totalDeposit * (apy / 100) / 365
  const fee = dailyYield * (feeProto / 100)
  const prize = dailyYield - fee
  const winnerBalance = winner === 'A' ? userA : userB
  const winnerName = winner === 'A' ? 'Usuario A' : 'Usuario B'

  // State at each step
  const steps = [
    {
      title: 'Deposito inicial',
      desc: 'Usuarios depositan ETH. El vault emite rafETH 1:1. spETH backing = ETH depositado.',
      spETH: totalDeposit,
      rafETH: totalDeposit,
      formula: `spETH backing = ${fmt(userA)} + ${fmt(userB)} = ${fmt(totalDeposit)}`,
      formula2: `rafETH supply = ${fmt(totalDeposit)} (1:1 con depositos)`,
      check: 'backing == totalSupply → Solvente',
    },
    {
      title: 'Durante la ronda — acumulacion de yield',
      desc: 'El staking genera yield. spETH crece, rafETH supply se mantiene. La diferencia es el surplus no asignado.',
      spETH: totalDeposit + dailyYield,
      rafETH: totalDeposit,
      formula: `dailyYield = ${fmt(totalDeposit)} × ${apy}% / 365 = ${fmt(dailyYield)} ETH`,
      formula2: `unallocatedSurplus = backing - totalSupply = ${fmt(totalDeposit + dailyYield)} - ${fmt(totalDeposit)} = ${fmt(dailyYield)}`,
      check: `surplus = ${fmt(dailyYield)} ETH (yield del dia)`,
    },
    {
      title: 'Cierre de ronda — minting del premio',
      desc: `El vault mintea ${fmt(prize)} rafETH a address(this) como premio. Fee de ${fmt(fee)} queda como surplus del protocolo.`,
      spETH: totalDeposit + dailyYield,
      rafETH: totalDeposit + prize,
      formula: `prize = surplus - fee = ${fmt(dailyYield)} - ${fmt(fee)} = ${fmt(prize)} rafETH`,
      formula2: `perRoundFee = ${fmt(dailyYield)} × ${feeProto}% = ${fmt(fee)} ETH (spec §9.3)`,
      check: `Nuevo supply = ${fmt(totalDeposit + prize)} | backing = ${fmt(totalDeposit + dailyYield)} | diff = fee = ${fmt(fee)}`,
    },
    {
      title: `Reclamo del ganador — ${winnerName}`,
      desc: `${winnerName} gana. Se transfiere ${fmt(prize)} rafETH desde vault al ganador. El ganador ahora tiene balance + prize.`,
      spETH: totalDeposit + dailyYield,
      rafETH: totalDeposit + prize,
      formula: `${winnerName} balance: ${fmt(winnerBalance)} + ${fmt(prize)} = ${fmt(winnerBalance + prize)} rafETH`,
      formula2: `Transferencia: vault.transfer(${winnerName}, ${fmt(prize)} rafETH)`,
      check: `rafETH totalSupply no cambia (es transfer, no mint)`,
    },
    {
      title: 'Solvencia post-claim',
      desc: 'Verificacion final: backing spETH debe cubrir totalSupply rafETH + fee acumulada.',
      spETH: totalDeposit + dailyYield,
      rafETH: totalDeposit + prize,
      formula: `backing = ${fmt(totalDeposit + dailyYield)} spETH`,
      formula2: `totalSupply + feeAccum = ${fmt(totalDeposit + prize)} + ${fmt(fee)} = ${fmt(totalDeposit + dailyYield)}`,
      check: `${fmt(totalDeposit + dailyYield)} == ${fmt(totalDeposit + dailyYield)} → SOLVENTE (spec §12)`,
    },
  ]

  const s = steps[tab]
  const maxVal = Math.max(s.spETH, s.rafETH) * 1.1

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Contabilidad del vault — &iquest;de donde viene el premio?</h2>
      <p className="text-text-dim text-sm mb-6">Spec &sect;9.3 y &sect;12</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-text-dim uppercase mb-4">Parametros</h3>
          <SliderInput label="Usuario A" value={userA} onChange={setUserA} min={0.001} max={10000} step={0.1} unit="ETH" />
          <SliderInput label="Usuario B" value={userB} onChange={setUserB} min={0.0001} max={100} step={0.0001} unit="ETH" />
          <SliderInput label="APY" value={apy} onChange={setApy} min={1} max={6} step={0.1} unit="%" />
          <SliderInput label="Fee protocolo" value={feeProto} onChange={setFeeProto} min={5} max={25} step={1} unit="%" />
          <div className="mt-4">
            <label className="text-sm text-text-dim block mb-2">Ganador de la ronda</label>
            <div className="flex gap-2">
              <button
                onClick={() => setWinner('A')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${winner === 'A' ? 'bg-accent text-white' : 'bg-bg border border-border text-text-dim'}`}
              >
                Usuario A
              </button>
              <button
                onClick={() => setWinner('B')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${winner === 'B' ? 'bg-red text-white' : 'bg-bg border border-border text-text-dim'}`}
              >
                Usuario B
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTab(i)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab === i ? 'bg-accent text-white' : 'bg-card border border-border text-text-dim hover:text-text'}`}
              >
                {i + 1}. {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-text-dim mb-5">{s.desc}</p>

            <BalanceBar label="Estado del vault" spETH={s.spETH} rafETH={s.rafETH} maxVal={maxVal} />

            <div className="space-y-3 mt-5">
              <div className="bg-bg rounded-lg p-3">
                <p className="text-[10px] text-text-dim uppercase mb-1">Formula</p>
                <p className="text-sm font-mono text-accent">{s.formula}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <p className="text-[10px] text-text-dim uppercase mb-1">Detalle</p>
                <p className="text-sm font-mono text-amber">{s.formula2}</p>
              </div>
              <div className={`bg-bg rounded-lg p-3 border-l-4 ${tab === 4 ? 'border-l-green' : 'border-l-accent'}`}>
                <p className="text-[10px] text-text-dim uppercase mb-1">Verificacion</p>
                <p className={`text-sm font-mono ${tab === 4 ? 'text-green' : 'text-text'}`}>{s.check}</p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Deposito total" value={`${fmt(totalDeposit)} ETH`} />
            <SummaryCard label="Yield diario" value={`${fmt(dailyYield)} ETH`} color="text-green" />
            <SummaryCard label="Premio" value={`${fmt(prize)} ETH`} color="text-accent" />
            <SummaryCard label="Fee protocolo" value={`${fmt(fee)} ETH`} color="text-amber" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color = 'text-text' }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border text-center">
      <p className="text-[10px] text-text-dim uppercase">{label}</p>
      <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
    </div>
  )
}
