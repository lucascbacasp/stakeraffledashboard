import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid, Cell,
} from 'recharts'
import SliderInput from '../components/shared/SliderInput'
import MetricCard from '../components/shared/MetricCard'

const fmt = (n, d = 4) => {
  if (n === undefined || n === null || isNaN(n)) return '0'
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(2)
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return n.toLocaleString('en', { maximumFractionDigits: 2 })
  return n.toFixed(Math.min(d, 4))
}

const SUBTABS = ['Proyeccion', 'Break-even', 'Sensibilidad', 'Escenarios TVL', 'Vs alternativas']

export default function FeeShareSimulator() {
  const [capital, setCapital] = useState(1000)
  const [apy, setApy] = useState(2.5)
  const [feeProto, setFeeProto] = useState(10)
  const [feeShare, setFeeShare] = useState(20)
  const [growth, setGrowth] = useState(100)
  const [horizon, setHorizon] = useState(3)
  const [ethPrice, setEthPrice] = useState(2500)
  const [subTab, setSubTab] = useState(0)

  const stakingAnnual = capital * (apy / 100)

  // Projection data
  const projection = useMemo(() => {
    const rows = []
    let cumFee = 0
    let cumStaking = 0
    for (let y = 1; y <= horizon; y++) {
      const tvl = capital * Math.pow(1 + growth / 100, y)
      const totalFee = tvl * (apy / 100) * (feeProto / 100)
      const investorFee = totalFee * (feeShare / 100)
      cumFee += investorFee
      cumStaking += stakingAnnual
      const apyEquiv = capital > 0 ? (investorFee / capital) * 100 : 0
      rows.push({ year: y, tvl, feeYear: investorFee, cumFee, cumStaking, apyEquiv, diffVsStaking: investorFee - stakingAnnual })
    }
    return rows
  }, [capital, apy, feeProto, feeShare, growth, horizon, stakingAnnual])

  // Break-even
  const breakEvenTvl = stakingAnnual / ((apy / 100) * (feeProto / 100) * (feeShare / 100)) || 0
  const breakEvenYear = useMemo(() => {
    if (growth <= 0) return 'Nunca'
    for (let y = 1; y <= 20; y++) {
      const tvl = capital * Math.pow(1 + growth / 100, y)
      if (tvl >= breakEvenTvl) return `Ano ${y}`
    }
    return '>20 anos'
  }, [capital, growth, breakEvenTvl])

  // Break-even curve
  const breakEvenCurve = useMemo(() => {
    const pts = []
    for (let share = 5; share <= 50; share += 5) {
      const tvlReq = stakingAnnual / ((apy / 100) * (feeProto / 100) * (share / 100)) || 0
      pts.push({ share: `${share}%`, tvl: tvlReq })
    }
    return pts
  }, [stakingAnnual, apy, feeProto])

  // Sensitivity heatmap
  const tvlLevels = [1000, 5000, 10000, 25000, 50000, 100000, 200000]
  const shareLevels = [10, 15, 20, 25, 30, 40, 50]
  const apyLevels = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6]

  // Scenarios
  const scenarios = useMemo(() => {
    const defs = [
      { name: 'Cold-start', mult: 1, desc: 'TVL = capital del inversor' },
      { name: 'Early', mult: 3, desc: 'TVL = 3x capital' },
      { name: 'Traccion', mult: 10, desc: 'TVL = 10x capital' },
      { name: 'Escala', mult: 50, desc: 'TVL = 50x capital' },
      { name: 'Consolidado', mult: 200, desc: 'TVL = 200x capital' },
    ]
    return defs.map(d => {
      const tvl = capital * d.mult
      const totalFee = tvl * (apy / 100) * (feeProto / 100)
      const investorFee = totalFee * (feeShare / 100)
      const eligible = tvl
      const prob = capital / eligible
      const raffleEV = prob * (tvl * (apy / 100) / 365 * (1 - feeProto / 100)) * 365
      return { ...d, tvl, investorFee, raffleEV, staking: stakingAnnual }
    })
  }, [capital, apy, feeProto, feeShare, stakingAnnual])

  // Alternatives
  const alternatives = useMemo(() => {
    const tvl1 = capital
    const tvl10 = capital * 10
    const tvl30 = capital * 30
    const feeCalc = tvl => tvl * (apy / 100) * (feeProto / 100) * (feeShare / 100)
    return [
      { name: 'Lido staking (~3.5%)', eth: capital * 0.035 },
      { name: 'Rocket Pool (~3.8%)', eth: capital * 0.038 },
      { name: 'AAVE lending (~2%)', eth: capital * 0.02 },
      { name: 'StakeRaffle fee (1x TVL)', eth: feeCalc(tvl1) },
      { name: 'StakeRaffle fee (10x TVL)', eth: feeCalc(tvl10) },
      { name: 'StakeRaffle fee (30x TVL)', eth: feeCalc(tvl30) },
    ]
  }, [capital, apy, feeProto, feeShare])

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Simulador Modelo C — Fee Share</h2>
      <p className="text-text-dim text-sm mb-6">Proyeccion de retornos para el inversor estrategico</p>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Global inputs */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-text-dim uppercase mb-4">Parametros globales</h3>
          <SliderInput label="Capital inversor" value={capital} onChange={setCapital} min={100} max={5000} step={50} unit="ETH" />
          <SliderInput label="APY Meta Pool" value={apy} onChange={setApy} min={1} max={7} step={0.1} unit="%" />
          <SliderInput label="Fee protocolo" value={feeProto} onChange={setFeeProto} min={5} max={25} step={1} unit="%" />
          <SliderInput label="% fee al inversor" value={feeShare} onChange={setFeeShare} min={5} max={60} step={1} unit="%" />
          <SliderInput label="Crecimiento TVL/ano" value={growth} onChange={setGrowth} min={0} max={300} step={5} unit="%" />
          <SliderInput label="Horizonte" value={horizon} onChange={setHorizon} min={1} max={5} step={1} unit="anos" />
          <SliderInput label="Precio ETH" value={ethPrice} onChange={setEthPrice} min={500} max={10000} step={50} unit="USD" />
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sub tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {SUBTABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setSubTab(i)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${subTab === i ? 'bg-accent text-white' : 'bg-card border border-border text-text-dim hover:text-text'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {subTab === 0 && <TabProjection data={projection} stakingAnnual={stakingAnnual} ethPrice={ethPrice} />}
          {subTab === 1 && <TabBreakEven breakEvenTvl={breakEvenTvl} breakEvenYear={breakEvenYear} ethPrice={ethPrice} curve={breakEvenCurve} growth={growth} />}
          {subTab === 2 && <TabSensitivity tvlLevels={tvlLevels} shareLevels={shareLevels} apyLevels={apyLevels} apy={apy} feeProto={feeProto} feeShare={feeShare} stakingAnnual={stakingAnnual} capital={capital} />}
          {subTab === 3 && <TabScenarios scenarios={scenarios} stakingAnnual={stakingAnnual} ethPrice={ethPrice} />}
          {subTab === 4 && <TabAlternatives alternatives={alternatives} stakingAnnual={stakingAnnual} ethPrice={ethPrice} />}
        </div>
      </div>
    </div>
  )
}

function TabProjection({ data, stakingAnnual, ethPrice }) {
  const last = data[data.length - 1] || {}
  const first = data[0] || {}
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Fee ano 1" value={`${fmt(first.feeYear)} ETH`} sub={`$${fmt(first.feeYear * ethPrice)}`} color="text-accent" />
        <MetricCard label={`Fee ano ${data.length}`} value={`${fmt(last.feeYear)} ETH`} sub={`$${fmt(last.feeYear * ethPrice)}`} color="text-green" />
        <MetricCard label="Acumulado" value={`${fmt(last.cumFee)} ETH`} sub={`$${fmt(last.cumFee * ethPrice)}`} color="text-amber" />
        <MetricCard label="Diff vs staking" value={`${fmt(last.cumFee - last.cumStaking)} ETH`} color={last.cumFee >= last.cumStaking ? 'text-green' : 'text-red'} />
      </div>
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Fee acumulada vs staking puro</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `Ano ${v}`} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip formatter={v => `${fmt(v)} ETH`} />
            <Legend />
            <Bar dataKey="cumFee" name="Fee share acum." fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cumStaking" name="Staking puro acum." fill="#64748b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-dim text-xs uppercase">
              <th className="p-3 text-left">Ano</th>
              <th className="p-3 text-right">TVL</th>
              <th className="p-3 text-right">Fee/ano</th>
              <th className="p-3 text-right">APY equiv</th>
              <th className="p-3 text-right">vs Staking</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.year} className="border-b border-border/50 hover:bg-card-hover">
                <td className="p-3">{r.year}</td>
                <td className="p-3 text-right font-mono">{fmt(r.tvl)} ETH</td>
                <td className="p-3 text-right font-mono">{fmt(r.feeYear)} ETH</td>
                <td className="p-3 text-right font-mono">{r.apyEquiv.toFixed(2)}%</td>
                <td className={`p-3 text-right font-mono ${r.diffVsStaking >= 0 ? 'text-green' : 'text-red'}`}>
                  {r.diffVsStaking >= 0 ? '+' : ''}{fmt(r.diffVsStaking)} ETH
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabBreakEven({ breakEvenTvl, breakEvenYear, ethPrice, curve, growth }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <MetricCard label="Break-even TVL" value={`${fmt(breakEvenTvl)} ETH`} sub={`$${fmt(breakEvenTvl * ethPrice)}`} color="text-amber" />
        <MetricCard label="Break-even en USD" value={`$${fmt(breakEvenTvl * ethPrice)}`} color="text-amber" />
        <MetricCard label="Lo alcanza en" value={breakEvenYear} sub={`con crecimiento ${growth}%/ano`} color="text-green" />
      </div>
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">TVL requerido segun % fee share</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={curve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="share" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip formatter={v => `${fmt(v)} ETH`} />
            <Line type="monotone" dataKey="tvl" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="TVL requerido" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TabSensitivity({ tvlLevels, shareLevels, apyLevels, apy, feeProto, feeShare, stakingAnnual, capital }) {
  const getColor = (val) => {
    const ratio = stakingAnnual > 0 ? val / stakingAnnual : 0
    if (ratio >= 1) return 'bg-green/20 text-green'
    if (ratio >= 0.5) return 'bg-amber/20 text-amber'
    return 'bg-red/20 text-red'
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-5 border border-border overflow-x-auto">
        <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Heatmap: TVL vs % fee share (ETH/ano)</h3>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-text-dim">TVL \ Share</th>
              {shareLevels.map(s => <th key={s} className="p-2 text-center text-text-dim">{s}%</th>)}
            </tr>
          </thead>
          <tbody>
            {tvlLevels.map(tvl => (
              <tr key={tvl}>
                <td className="p-2 font-mono text-text-dim">{fmt(tvl)} ETH</td>
                {shareLevels.map(share => {
                  const val = tvl * (apy / 100) * (feeProto / 100) * (share / 100)
                  return (
                    <td key={share} className={`p-2 text-center font-mono rounded ${getColor(val)}`}>
                      {fmt(val, 2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border overflow-x-auto">
        <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Sensibilidad al APY (TVL fijo = staking benchmark ref)</h3>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-text-dim">APY \ TVL</th>
              {tvlLevels.slice(0, 5).map(t => <th key={t} className="p-2 text-center text-text-dim">{fmt(t)}</th>)}
            </tr>
          </thead>
          <tbody>
            {apyLevels.map(a => (
              <tr key={a}>
                <td className="p-2 font-mono text-text-dim">{a}%</td>
                {tvlLevels.slice(0, 5).map(tvl => {
                  const val = tvl * (a / 100) * (feeProto / 100) * (feeShare / 100)
                  const stk = capital * (a / 100)
                  const ratio = stk > 0 ? val / stk : 0
                  const cls = ratio >= 1 ? 'bg-green/20 text-green' : ratio >= 0.5 ? 'bg-amber/20 text-amber' : 'bg-red/20 text-red'
                  return <td key={tvl} className={`p-2 text-center font-mono rounded ${cls}`}>{fmt(val, 2)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabScenarios({ scenarios, stakingAnnual, ethPrice }) {
  const chartData = scenarios.map(s => ({
    name: s.name,
    feeShare: s.investorFee,
    raffleEV: s.raffleEV,
    staking: s.staking,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {scenarios.map(s => (
          <div key={s.name} className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-text-dim uppercase">{s.name}</p>
            <p className="text-sm font-bold text-accent">{fmt(s.investorFee)} ETH/ano</p>
            <p className="text-[10px] text-text-dim">{s.desc}</p>
            <p className="text-[10px] text-text-dim">TVL: {fmt(s.tvl)} ETH</p>
            <p className={`text-[10px] font-medium mt-1 ${s.investorFee >= stakingAnnual ? 'text-green' : 'text-red'}`}>
              vs staking: {s.investorFee >= stakingAnnual ? '+' : ''}{fmt(s.investorFee - stakingAnnual)} ETH
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Fee share + raffle EV vs staking</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip formatter={v => `${fmt(v)} ETH`} />
            <Legend />
            <Bar dataKey="feeShare" name="Fee share" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="raffleEV" name="Raffle EV" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="staking" name="Staking puro" fill="#64748b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-dim text-xs uppercase">
              <th className="p-3 text-left">Escenario</th>
              <th className="p-3 text-right">TVL</th>
              <th className="p-3 text-right">Fee share</th>
              <th className="p-3 text-right">Raffle EV</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">vs Staking</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(s => {
              const total = s.investorFee + s.raffleEV
              const diff = total - stakingAnnual
              return (
                <tr key={s.name} className="border-b border-border/50 hover:bg-card-hover">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-right font-mono">{fmt(s.tvl)} ETH</td>
                  <td className="p-3 text-right font-mono">{fmt(s.investorFee)}</td>
                  <td className="p-3 text-right font-mono">{fmt(s.raffleEV)}</td>
                  <td className="p-3 text-right font-mono font-bold">{fmt(total)}</td>
                  <td className={`p-3 text-right font-mono ${diff >= 0 ? 'text-green' : 'text-red'}`}>
                    {diff >= 0 ? '+' : ''}{fmt(diff)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabAlternatives({ alternatives, stakingAnnual, ethPrice }) {
  const maxVal = Math.max(...alternatives.map(a => a.eth))
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="text-sm font-semibold text-text-dim uppercase mb-3">Retorno anual comparado (ETH/ano)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={alternatives} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={180} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip formatter={v => `${fmt(v)} ETH ($${fmt(v * ethPrice)})`} />
            <Bar dataKey="eth" name="ETH/ano" radius={[0, 4, 4, 0]}>
              {alternatives.map((a, i) => (
                <Cell key={i} fill={i < 3 ? '#64748b' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-dim text-xs uppercase">
              <th className="p-3 text-left">Alternativa</th>
              <th className="p-3 text-right">ETH/ano</th>
              <th className="p-3 text-right">USD/ano</th>
              <th className="p-3 text-right">vs Staking 2.5%</th>
            </tr>
          </thead>
          <tbody>
            {alternatives.map((a, i) => {
              const diff = a.eth - stakingAnnual
              return (
                <tr key={i} className="border-b border-border/50 hover:bg-card-hover">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-right font-mono">{fmt(a.eth)}</td>
                  <td className="p-3 text-right font-mono">${fmt(a.eth * ethPrice)}</td>
                  <td className={`p-3 text-right font-mono ${diff >= 0 ? 'text-green' : 'text-red'}`}>
                    {diff >= 0 ? '+' : ''}{fmt(diff)} ETH
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
