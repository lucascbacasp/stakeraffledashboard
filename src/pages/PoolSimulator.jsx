import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import SliderInput from '../components/shared/SliderInput'
import MetricCard from '../components/shared/MetricCard'
import HlBox from '../components/shared/HlBox'

const fmt = (n, d = 4) => {
  if (n === 0) return '0'
  if (n < 0.000001) return n.toExponential(4)
  if (n < 1) return n.toFixed(d)
  return n.toLocaleString('en', { maximumFractionDigits: 2 })
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#14b8a6', '#84cc16', '#eab308', '#f97316', '#f43f5e',
  '#a855f7', '#22d3ee', '#34d399', '#fbbf24', '#fb923c', '#e879f9', '#2dd4bf', '#a3e635', '#facc15',
  '#fb7185', '#c084fc', '#67e8f9']

export default function PoolSimulator() {
  const [nInvestors, setNInvestors] = useState(5)
  const [ethPerInvestor, setEthPerInvestor] = useState(500)
  const [retailA, setRetailA] = useState(120)
  const [retailB, setRetailB] = useState(0.001)
  const [apy, setApy] = useState(2.5)
  const [feeProto, setFeeProto] = useState(10)

  const participants = useMemo(() => {
    const list = []
    for (let i = 0; i < nInvestors; i++) {
      list.push({ name: `Inv ${i + 1}`, eth: ethPerInvestor, type: 'investor' })
    }
    list.push({ name: 'Retail A', eth: retailA, type: 'retail' })
    list.push({ name: 'Retail B', eth: retailB, type: 'retail' })
    return list
  }, [nInvestors, ethPerInvestor, retailA, retailB])

  const tvl = participants.reduce((s, p) => s + p.eth, 0)
  const dailyYield = tvl * (apy / 100) / 365
  const fee = dailyYield * (feeProto / 100)
  const prize = dailyYield - fee
  const feeMonth = fee * 30

  const investorTotal = nInvestors * ethPerInvestor
  const investorPct = tvl > 0 ? (investorTotal / tvl) * 100 : 0
  const concentrationLevel = investorPct > 85 ? 'red' : investorPct > 60 ? 'amber' : 'green'
  const concentrationLabel = investorPct > 85 ? 'Alto riesgo de percepcion de juego amanado' : investorPct > 60 ? 'Concentracion moderada' : 'Distribucion saludable'

  const table = participants.map(p => {
    const pct = tvl > 0 ? p.eth / tvl : 0
    const prob = pct
    const evDay = prob * prize
    const evYear = evDay * 365
    const stakingYear = p.eth * (apy / 100)
    return { ...p, pct: pct * 100, prob: prob * 100, evYear, stakingYear }
  })

  const stakingBenchmark = tvl * (apy / 100) / participants.length

  // Cap analysis
  const capPct = 0.1
  const cappedInvestorEth = ethPerInvestor * capPct
  const cappedTvl = nInvestors * cappedInvestorEth + retailA + retailB
  const cappedInvPct = cappedTvl > 0 ? (nInvestors * cappedInvestorEth / cappedTvl) * 100 : 0

  // Chart data
  const chartData = participants.map((p, i) => ({
    name: p.name,
    eth: p.eth,
    fill: p.type === 'retail' ? (p.name === 'Retail A' ? '#ef4444' : '#ec4899') : COLORS[i % COLORS.length],
  }))

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Simulador de pool — inversores estrategicos vs retail</h2>
      <p className="text-text-dim text-sm mb-6">Analiza concentracion y dinamica del pool</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-text-dim uppercase mb-4">Parametros</h3>
          <SliderInput label="N inversores estrategicos" value={nInvestors} onChange={setNInvestors} min={1} max={20} step={1} />
          <SliderInput label="ETH por inversor" value={ethPerInvestor} onChange={setEthPerInvestor} min={10} max={5000} step={10} unit="ETH" />
          <SliderInput label="Retail A" value={retailA} onChange={setRetailA} min={0.001} max={10000} step={0.1} unit="ETH" />
          <SliderInput label="Retail B" value={retailB} onChange={setRetailB} min={0.0001} max={100} step={0.0001} unit="ETH" />
          <SliderInput label="APY" value={apy} onChange={setApy} min={1} max={6} step={0.1} unit="%" />
          <SliderInput label="Fee protocolo" value={feeProto} onChange={setFeeProto} min={5} max={25} step={1} unit="%" />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="TVL Total" value={`${fmt(tvl)} ETH`} />
            <MetricCard label="Premio/dia" value={`${fmt(prize)} ETH`} color="text-green" />
            <MetricCard label="Fee/dia" value={`${fmt(fee)} ETH`} color="text-amber" />
            <MetricCard label="Fee/mes" value={`${fmt(feeMonth)} ETH`} color="text-amber" />
          </div>

          {/* Concentration indicator */}
          <div className={`bg-card rounded-xl p-4 border border-border border-l-4 ${concentrationLevel === 'red' ? 'border-l-red' : concentrationLevel === 'amber' ? 'border-l-amber' : 'border-l-green'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${concentrationLevel === 'red' ? 'bg-red' : concentrationLevel === 'amber' ? 'bg-amber' : 'bg-green'}`} />
              <div>
                <p className="text-sm font-semibold">Concentracion inversores: {investorPct.toFixed(1)}%</p>
                <p className="text-xs text-text-dim">{concentrationLabel}</p>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Composicion del Pool</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip formatter={v => `${fmt(v)} ETH`} />
                <Bar dataKey="eth" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => (
                    <rect key={i} fill={d.fill} />
                  ))}
                </Bar>
                <ReferenceLine y={stakingBenchmark} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Staking avg', fill: '#ef4444', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-dim text-xs uppercase">
                  <th className="text-left p-3">Participante</th>
                  <th className="text-right p-3">ETH</th>
                  <th className="text-right p-3">% Pool</th>
                  <th className="text-right p-3">Prob %</th>
                  <th className="text-right p-3">EV Anual</th>
                  <th className="text-right p-3">vs Staking</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => {
                  const diff = r.evYear - r.stakingYear
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-card-hover">
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3 text-right font-mono">{fmt(r.eth)}</td>
                      <td className="p-3 text-right font-mono">{r.pct.toFixed(4)}%</td>
                      <td className="p-3 text-right font-mono">{r.prob.toFixed(6)}%</td>
                      <td className="p-3 text-right font-mono">{fmt(r.evYear)} ETH</td>
                      <td className={`p-3 text-right font-mono ${diff >= 0 ? 'text-green' : 'text-red'}`}>
                        {diff >= 0 ? '+' : ''}{fmt(diff)} ETH
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cap section */}
          <HlBox color="border-accent">
            <p className="text-sm font-semibold text-accent mb-2">Cap de elegibilidad (10% del stake)</p>
            <p className="text-xs text-text-dim mb-2">
              Si cada inversor solo puede usar el 10% de su stake para el raffle:
            </p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-text-dim text-xs">ETH elegible/inv</p>
                <p className="font-mono font-bold">{fmt(cappedInvestorEth)}</p>
              </div>
              <div>
                <p className="text-text-dim text-xs">TVL elegible</p>
                <p className="font-mono font-bold">{fmt(cappedTvl)}</p>
              </div>
              <div>
                <p className="text-text-dim text-xs">Concentracion inv</p>
                <p className={`font-mono font-bold ${cappedInvPct > 85 ? 'text-red' : cappedInvPct > 60 ? 'text-amber' : 'text-green'}`}>
                  {cappedInvPct.toFixed(1)}%
                </p>
              </div>
            </div>
          </HlBox>
        </div>
      </div>
    </div>
  )
}
