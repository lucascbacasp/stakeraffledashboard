import { useState, useMemo } from 'react'
import SliderInput from '../components/shared/SliderInput'
import MetricCard from '../components/shared/MetricCard'

const fmt = (n, d = 4) => {
  if (n === undefined || isNaN(n)) return '0'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e3) return n.toLocaleString('en', { maximumFractionDigits: 2 })
  if (n < 1 && n > 0) return n.toFixed(d)
  return n.toFixed(2)
}

export default function TermSheet() {
  const [capital, setCapital] = useState(1000)
  const [apy, setApy] = useState(2.5)
  const [feeProto, setFeeProto] = useState(10)
  const [feeShare, setFeeShare] = useState(20)
  const [growth, setGrowth] = useState(100)
  const [horizon, setHorizon] = useState(3)
  const [ethPrice, setEthPrice] = useState(2500)
  const [tokenPct, setTokenPct] = useState(5)
  const [fdv, setFdv] = useState(10)
  const [nInvestors, setNInvestors] = useState(1)

  const data = useMemo(() => {
    const stakingAnnual = capital * (apy / 100)
    const perInvestorShare = feeShare / nInvestors
    const totalFeeSharePct = feeShare

    // Year projections
    const years = []
    let cumFee = 0
    for (let y = 1; y <= horizon; y++) {
      const tvl = capital * nInvestors * Math.pow(1 + growth / 100, y)
      const totalFee = tvl * (apy / 100) * (feeProto / 100)
      const investorFee = totalFee * (perInvestorShare / 100)
      cumFee += investorFee
      years.push({ year: y, tvl, investorFee, cumFee })
    }

    const feeY1 = years[0]?.investorFee || 0
    const feeYN = years[years.length - 1]?.investorFee || 0
    const tokenValue = (fdv * 1e6) * (tokenPct / 100) / nInvestors
    const tokenValueETH = tokenValue / ethPrice
    const minReturn = feeY1
    const targetReturn = feeYN
    const upsideToken = tokenValueETH

    const totalFeeAllInvestors = totalFeeSharePct
    const totalTokenAllInvestors = tokenPct * nInvestors

    // Warnings
    const warnings = []
    if (totalFeeAllInvestors > 50) warnings.push('El protocolo queda sin fondos operativos (fee total a inversores > 50%)')
    if (totalTokenAllInvestors > 30) warnings.push('Riesgo de governance takeover (token > 30% de supply a inversores)')
    const stakingY3 = capital * (apy / 100)
    const feeY3 = years[Math.min(2, years.length - 1)]?.investorFee || 0
    if (feeY3 < stakingY3) warnings.push('Deal no competitivo sin token upside (fee share < APY staking en ano 3)')

    return {
      stakingAnnual, perInvestorShare, totalFeeSharePct, years, feeY1, feeYN,
      tokenValue, tokenValueETH, minReturn, targetReturn, upsideToken,
      totalTokenAllInvestors, warnings, cumFee,
    }
  }, [capital, apy, feeProto, feeShare, growth, horizon, ethPrice, tokenPct, fdv, nInvestors])

  const copyMarkdown = () => {
    const md = generateMarkdown()
    navigator.clipboard.writeText(md)
  }

  const generateMarkdown = () => {
    return `# Term Sheet — StakeRaffle Modelo C Hibrido

## Resumen Ejecutivo
- **Capital por inversor:** ${fmt(capital)} ETH ($${fmt(capital * ethPrice)})
- **Retorno minimo (ano 1):** ${fmt(data.feeY1)} ETH/ano (${((data.feeY1 / capital) * 100).toFixed(2)}% APY equiv)
- **Retorno objetivo (ano ${horizon}):** ${fmt(data.feeYN)} ETH/ano (${((data.feeYN / capital) * 100).toFixed(2)}% APY equiv)
- **Upside token:** ${fmt(data.tokenValueETH)} ETH ($${fmt(data.tokenValue)}) al FDV estimado

## Terminos Financieros
| Parametro | Valor |
|---|---|
| Capital requerido | ${fmt(capital)} ETH |
| Fee share por inversor | ${data.perInvestorShare.toFixed(1)}% de fee protocolo |
| Token allocation | ${tokenPct}% del supply |
| FDV estimado | $${fmt(fdv)}M |
| Valor token por inversor | $${fmt(data.tokenValue)} (${fmt(data.tokenValueETH)} ETH) |

## Terminos Operacionales
| Parametro | Valor |
|---|---|
| APY base (Meta Pool) | ${apy}% |
| Fee protocolo | ${feeProto}% |
| Crecimiento TVL esperado | ${growth}%/ano |
| Horizonte de inversion | ${horizon} anos |

## Proteccion del Protocolo
- Fee total a inversores: ${data.totalFeeSharePct}%
- Token total a inversores: ${data.totalTokenAllInvestors}%
- N inversores: ${nInvestors}

${data.warnings.length > 0 ? '## Warnings\n' + data.warnings.map(w => `- ⚠ ${w}`).join('\n') : ''}

## Proyeccion
${data.years.map(y => `- Ano ${y.year}: TVL ${fmt(y.tvl)} ETH | Fee ${fmt(y.investorFee)} ETH | Acum ${fmt(y.cumFee)} ETH`).join('\n')}
`
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Term Sheet — Modelo C Hibrido</h2>
      <p className="text-text-dim text-sm mb-6">Documento dinamico para inversores estrategicos</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-text-dim uppercase mb-4">Parametros</h3>
          <SliderInput label="Capital inversor" value={capital} onChange={setCapital} min={100} max={5000} step={50} unit="ETH" />
          <SliderInput label="APY Meta Pool" value={apy} onChange={setApy} min={1} max={7} step={0.1} unit="%" />
          <SliderInput label="Fee protocolo" value={feeProto} onChange={setFeeProto} min={5} max={25} step={1} unit="%" />
          <SliderInput label="% fee al inversor" value={feeShare} onChange={setFeeShare} min={5} max={60} step={1} unit="%" />
          <SliderInput label="Crecimiento TVL/ano" value={growth} onChange={setGrowth} min={0} max={300} step={5} unit="%" />
          <SliderInput label="Horizonte" value={horizon} onChange={setHorizon} min={1} max={5} step={1} unit="anos" />
          <SliderInput label="Precio ETH" value={ethPrice} onChange={setEthPrice} min={500} max={10000} step={50} unit="USD" />
          <div className="border-t border-border mt-4 pt-4">
            <h3 className="text-sm font-semibold text-text-dim uppercase mb-4">Token & Inversores</h3>
            <SliderInput label="Token % supply" value={tokenPct} onChange={setTokenPct} min={1} max={20} step={0.5} unit="%" />
            <SliderInput label="FDV estimado" value={fdv} onChange={setFdv} min={1} max={100} step={1} unit="$M" />
            <SliderInput label="N inversores totales" value={nInvestors} onChange={setNInvestors} min={1} max={10} step={1} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Executive summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Retorno min (ano 1)" value={`${fmt(data.feeY1)} ETH`} sub={`${((data.feeY1 / capital) * 100).toFixed(2)}% APY equiv`} color="text-accent" />
            <MetricCard label={`Retorno obj (ano ${horizon})`} value={`${fmt(data.feeYN)} ETH`} sub={`${((data.feeYN / capital) * 100).toFixed(2)}% APY equiv`} color="text-green" />
            <MetricCard label="Upside token" value={`${fmt(data.tokenValueETH)} ETH`} sub={`$${fmt(data.tokenValue)}`} color="text-amber" />
            <MetricCard label="Staking puro ref" value={`${fmt(data.stakingAnnual)} ETH`} sub={`${apy}% APY`} />
          </div>

          {/* Warnings */}
          {data.warnings.length > 0 && (
            <div className="space-y-2">
              {data.warnings.map((w, i) => (
                <div key={i} className="bg-red/10 border border-red/30 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-red text-lg">&#9888;</span>
                  <p className="text-sm text-red">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Term Sheet Document */}
          <div className="bg-card rounded-xl border border-border">
            {/* Financial terms */}
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-semibold mb-4">Terminos Financieros</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Row label="Capital requerido" value={`${fmt(capital)} ETH ($${fmt(capital * ethPrice)})`} />
                <Row label="Fee share por inversor" value={`${data.perInvestorShare.toFixed(1)}% de fee protocolo`} />
                <Row label="Token allocation" value={`${tokenPct}% del supply`} />
                <Row label="FDV estimado" value={`$${fmt(fdv)}M`} />
                <Row label="Valor token/inversor" value={`$${fmt(data.tokenValue)} (${fmt(data.tokenValueETH)} ETH)`} />
                <Row label="Staking benchmark" value={`${fmt(data.stakingAnnual)} ETH/ano (${apy}%)`} />
              </div>
            </div>

            {/* Operational terms */}
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-semibold mb-4">Terminos Operacionales</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Row label="APY base (Meta Pool)" value={`${apy}%`} />
                <Row label="Fee protocolo" value={`${feeProto}%`} />
                <Row label="Crecimiento TVL esperado" value={`${growth}%/ano`} />
                <Row label="Horizonte de inversion" value={`${horizon} anos`} />
                <Row label="N inversores" value={`${nInvestors}`} />
              </div>
            </div>

            {/* Protocol protection */}
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-semibold mb-4">Proteccion del Protocolo</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Row label="Fee total a inversores" value={`${data.totalFeeSharePct}%`} warn={data.totalFeeSharePct > 50} />
                <Row label="Token total a inversores" value={`${data.totalTokenAllInvestors}%`} warn={data.totalTokenAllInvestors > 30} />
                <Row label="Fee retenida protocolo" value={`${(100 - data.totalFeeSharePct).toFixed(1)}%`} />
                <Row label="Token retenido protocolo" value={`${(100 - data.totalTokenAllInvestors).toFixed(1)}%`} />
              </div>
            </div>

            {/* Projection table */}
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-4">Proyeccion de retornos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-dim text-xs uppercase">
                      <th className="p-2 text-left">Ano</th>
                      <th className="p-2 text-right">TVL</th>
                      <th className="p-2 text-right">Fee/ano</th>
                      <th className="p-2 text-right">APY equiv</th>
                      <th className="p-2 text-right">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.years.map(y => (
                      <tr key={y.year} className="border-b border-border/50">
                        <td className="p-2">{y.year}</td>
                        <td className="p-2 text-right font-mono">{fmt(y.tvl)} ETH</td>
                        <td className="p-2 text-right font-mono">{fmt(y.investorFee)} ETH</td>
                        <td className="p-2 text-right font-mono">{((y.investorFee / capital) * 100).toFixed(2)}%</td>
                        <td className="p-2 text-right font-mono">{fmt(y.cumFee)} ETH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={copyMarkdown}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent/80 text-white font-semibold transition"
          >
            Copiar como Markdown
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, warn = false }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/30">
      <span className="text-text-dim">{label}</span>
      <span className={`font-mono ${warn ? 'text-red font-semibold' : 'text-text'}`}>{value}</span>
    </div>
  )
}
