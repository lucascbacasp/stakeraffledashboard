import { useState } from 'react'

const PHASES = [
  { id: 'onboarding', label: '1 \u00b7 Onboarding' },
  { id: 'deposito', label: '2 \u00b7 Dep\u00f3sito' },
  { id: 'token', label: '3 \u00b7 Token rafETH' },
  { id: 'elegibilidad', label: '4 \u00b7 Elegibilidad' },
  { id: 'cierre', label: '5 \u00b7 Cierre de ronda' },
  { id: 'vrf', label: '6 \u00b7 VRF' },
  { id: 'finalizacion', label: '7 \u00b7 Finalizaci\u00f3n' },
  { id: 'reclamo', label: '8 \u00b7 Reclamo' },
  { id: 'redencion', label: '9 \u00b7 Redenci\u00f3n' },
]

/* ── phase data keyed by id ── */
const DATA = {
  onboarding: {
    icon: '\ud83e\udd1d',
    title: 'Descubrimiento y conexi\u00f3n de wallet',
    intro: 'El usuario llega a StakeRaffle con ETH en su wallet. Su motivaci\u00f3n: mantener exposici\u00f3n a ETH y tener chance de un premio diario sin arriesgar capital.',
    highlight: {
      label: 'Propuesta de valor central (del spec)',
      text: 'StakeRaffle es un protocolo de raffle sin p\u00e9rdida. El usuario deposita ETH, recibe rafETH, y participa en rondas peri\u00f3dicas de premios financiadas por el surplus de backing del vault \u2014 nunca por el capital del usuario.',
      ref: '\u00a71',
    },
    cols: [
      {
        icon: '\ud83e\udea8',
        title: 'Activos aceptados',
        text: 'El contrato acepta ETH o WETH directamente. Si el usuario deposita ETH nativo, el contrato lo envuelve a WETH autom\u00e1ticamente en la misma transacci\u00f3n. El usuario no necesita hacer nada extra.',
        ref: '\u00a76.1',
      },
      {
        icon: '\ud83d\udca1',
        title: 'Lo que el usuario NO pierde',
        text: 'Su principal est\u00e1 representado 1:1 por rafETH y siempre es redimible. Los premios se fondean solo con el yield generado por Meta Pool spETH \u2014 nunca con el capital de otros usuarios.',
        ref: '\u00a73, \u00a76.2',
        bold: 'solo con el yield',
      },
    ],
    actors: [
      { icon: '\ud83d\udc64', name: 'Usuario', desc: 'deposita, retira, reclama premio' },
      { icon: '\ud83d\udc77', name: 'Operador', desc: 'cierra rondas, finaliza ganador on-chain' },
      { icon: '\ud83d\udcbb', name: 'Backend/Bot', desc: 'calcula elegibilidad off-chain, deriva ganador' },
      { icon: '\ud83c\udfdb\ufe0f', name: 'Meta Pool spETH', desc: 'fuente de yield y backing asset' },
      { icon: '\ud83c\udfb2', name: 'Chainlink VRF', desc: 'randomness verificable on-chain' },
    ],
  },

  deposito: {
    icon: '\ud83d\udcb0',
    title: 'Flujo de dep\u00f3sito',
    intro: 'El usuario deposita ETH o WETH. El vault convierte el principal en spETH y emite rafETH 1:1 como recibo del dep\u00f3sito.',
    highlight: {
      label: 'Flujo interno del dep\u00f3sito',
      text: 'ETH \u2192 WETH (wrap autom\u00e1tico) \u2192 Meta Pool (mint spETH) \u2192 rafETH emitido al usuario 1:1. El vault retiene el spETH como backing asset.',
      ref: '\u00a76.1, \u00a76.2',
    },
    cols: [
      {
        icon: '\u21a9\ufe0f',
        title: 'Wrapping autom\u00e1tico',
        text: 'Si el usuario env\u00eda ETH nativo, el contrato lo envuelve en WETH dentro de la misma transacci\u00f3n. WETH es el activo interno de dep\u00f3sito del vault.',
        ref: '\u00a76.1',
      },
      {
        icon: '\ud83c\udfe6',
        title: 'Backing con spETH',
        text: 'El WETH depositado se suministra a Meta Pool para mintear spETH. El vault mantiene f\u00edsicamente spETH como \u00fanico activo de respaldo del protocolo.',
        ref: '\u00a74.4, \u00a711',
      },
    ],
    steps: [
      { num: 1, text: 'Usuario env\u00eda ETH o WETH al contrato' },
      { num: 2, text: 'Si es ETH nativo, se wrappea a WETH autom\u00e1ticamente' },
      { num: 3, text: 'WETH se deposita en Meta Pool \u2192 se recibe spETH' },
      { num: 4, text: 'Se mintea rafETH 1:1 al usuario como recibo' },
      { num: 5, text: 'Evento de dep\u00f3sito emitido on-chain' },
    ],
  },

  token: {
    icon: '\ud83c\udff7\ufe0f',
    title: 'Token rafETH \u2014 recibo de principal',
    intro: 'rafETH es el token que representa el principal del usuario. Se mintea 1:1 contra el dep\u00f3sito y es transferible, pero las transferencias afectan la elegibilidad.',
    highlight: {
      label: 'Modelo de token fijo',
      text: '1 rafETH = 1 unidad de claim sobre ETH principal. No es un vault token rebasing \u2014 el valor no cambia. Los premios se entregan como rafETH adicional, no como apreciaci\u00f3n del token.',
      ref: '\u00a76.2',
    },
    cols: [
      {
        icon: '\ud83d\udd04',
        title: 'Transferibilidad',
        text: 'rafETH es transferible (ERC-20), pero transferir afecta la elegibilidad bajo el procedimiento estricto off-chain. El protocolo prefiere falsos negativos sobre falsos positivos al interpretar balances transferidos.',
        ref: '\u00a77.2',
        bold: 'falsos negativos sobre falsos positivos',
      },
      {
        icon: '\ud83d\udee1\ufe0f',
        title: 'Exclusi\u00f3n del vault',
        text: 'El balance de rafETH del propio vault en address(this) es categ\u00f3ricamente inelegible. Esto incluye premios reservados y fees acumuladas \u2014 nunca participan en la rifa.',
        ref: '\u00a77, \u00a712',
      },
    ],
    callout: {
      label: 'Seguridad cr\u00edtica',
      text: 'Las transferencias son security-critical. Para cada transfer de rafETH, el procedimiento off-chain interpreta los balances del sender y receiver solo usando sus checkpoints definidos.',
      ref: '\u00a77.2',
      color: 'border-l-red',
    },
  },

  elegibilidad: {
    icon: '\ud83d\udccb',
    title: 'Modelo de elegibilidad',
    intro: 'La elegibilidad NO se computa on-chain. Un backend autorizado calcula determin\u00edsticamente qu\u00e9 balances califican usando exactamente dos snapshots off-chain.',
    highlight: {
      label: 'M\u00e9todo de dos snapshots',
      text: 'El backend toma exactamente 2 snapshots off-chain por ronda. El m\u00e9todo es determin\u00edstico y estricto: balances recientemente depositados, transferidos o reclamados son tratados como inmaduros. Observadores independientes pueden reproducir el resultado.',
      ref: '\u00a77.1',
    },
    cols: [
      {
        icon: '\u2705',
        title: 'Qu\u00e9 es elegible',
        text: 'Balances de rafETH que satisfacen el procedimiento off-chain para esa ronda. Solo balances que han mantenido continuidad durante la ventana de participaci\u00f3n califican.',
        ref: '\u00a77',
      },
      {
        icon: '\u274c',
        title: 'Qu\u00e9 NO es elegible',
        text: 'Dep\u00f3sitos recientes, transferencias entrantes recientes, premios reci\u00e9n reclamados, y cualquier balance del vault en address(this). Anti-gaming por defecto.',
        ref: '\u00a73, \u00a77.2',
      },
    ],
    flow: [
      { step: 'Snapshot 1', desc: 'Balance del holder en t\u2081 (antes de cierre)' },
      { step: 'Snapshot 2', desc: 'Balance del holder en t\u2082 (al momento del cierre)' },
      { step: 'Comparaci\u00f3n', desc: 'min(s1, s2) como balance elegible estricto' },
      { step: 'Exclusi\u00f3n', desc: 'address(this) removido categ\u00f3ricamente' },
      { step: 'Resultado', desc: 'Set elegible + eligibleRaffleSupply publicados' },
    ],
  },

  cierre: {
    icon: '\ud83d\udd12',
    title: 'Cierre de ronda',
    intro: 'El operador cierra la ronda on-chain despu\u00e9s de que roundDuration haya transcurrido. El cierre snapshot\u00eda el premio, aplica el fee y decide si se solicita randomness.',
    highlight: {
      label: 'F\u00f3rmula de cierre (spec \u00a79.3)',
      text: 'grossBackingSurplus = max(currentBackingInEth \u2212 totalSupply(), 0)\nunallocatedSurplus = max(grossBackingSurplus \u2212 accruedReserveFeeShares, 0)\nroundPrize = unallocatedSurplus \u2212 perRoundFee (solo si > 0)',
      ref: '\u00a79.3, \u00a712',
    },
    cols: [
      {
        icon: '\ud83c\udfaf',
        title: 'Ronda con premio',
        text: 'Si unallocatedSurplus > perRoundFee: se mintean prize shares a address(this), se incrementa accruedReserveFeeShares, se solicita Chainlink VRF, ronda pasa a Closed.',
        ref: '\u00a79.3',
      },
      {
        icon: '\ud83d\udeab',
        title: 'Ronda descartada',
        text: 'Si el surplus no excede el fee: premio = 0, no se mintea nada, no se solicita VRF, no se incrementa el fee acumulado. La ronda pasa a Discarded.',
        ref: '\u00a79.3',
      },
    ],
    steps: [
      { num: 1, text: 'Operador llama closeRaffle(eligibleRaffleSupply, eligibilityArtifactHash)' },
      { num: 2, text: 'Contrato registra endTimestamp + endBlockNumber' },
      { num: 3, text: 'Calcula grossBackingSurplus y unallocatedSurplus' },
      { num: 4, text: 'Aplica perRoundFee flat como pol\u00edtica de reserva operativa' },
      { num: 5, text: 'Si prize > 0: mintea rafETH a vault, solicita VRF \u2192 Closed' },
      { num: 6, text: 'Si prize = 0: ronda \u2192 Discarded (sin VRF ni ganador)' },
      { num: 7, text: 'Auto-start de siguiente ronda si rafflesEnabled = true' },
    ],
  },

  vrf: {
    icon: '\ud83c\udfb2',
    title: 'Chainlink VRF \u2014 randomness on-chain',
    intro: 'Chainlink VRF provee randomness verificable. El contrato reduce el output VRF contra el eligibleRaffleSupply para obtener un winner wei almacenado on-chain.',
    highlight: {
      label: 'Flujo as\u00edncrono VRF \u2192 Winner Wei',
      text: 'La ronda se cierra y solicita VRF en la misma tx. Chainlink responde as\u00edncronamente. El contrato reduce: winnerWei = vrfOutput % eligibleRaffleSupply, y lo almacena on-chain para la ronda.',
      ref: '\u00a79.5',
    },
    cols: [
      {
        icon: '\ud83d\udd10',
        title: 'Verificabilidad',
        text: 'El VRF output es verificable on-chain. Cualquier observador puede confirmar que el n\u00famero aleatorio proviene de Chainlink y no fue manipulado por el operador.',
        ref: '\u00a79, \u00a715',
      },
      {
        icon: '\u23f3',
        title: 'Resoluci\u00f3n as\u00edncrona',
        text: 'La ronda permanece en estado Closed mientras espera el VRF. Una nueva ronda Started puede coexistir con una ronda Closed esperando fulfillment.',
        ref: '\u00a79.5, \u00a710',
      },
    ],
    callout: {
      label: 'Winner Wei \u2260 Winner Address',
      text: 'El contrato almacena un winner wei (n\u00famero), no una address. La derivaci\u00f3n del ganador real ocurre off-chain usando el eligibility artifact + winner wei. Esto es intencional: el mapping de intervalos proporcionales vive off-chain.',
      ref: '\u00a78',
      color: 'border-l-amber',
    },
  },

  finalizacion: {
    icon: '\ud83c\udfc6',
    title: 'Derivaci\u00f3n y finalizaci\u00f3n del ganador',
    intro: 'El backend deriva el ganador off-chain de forma determin\u00edstica y el operador lo finaliza on-chain.',
    highlight: {
      label: 'Selecci\u00f3n proporcional a balance elegible',
      text: 'Participantes elegibles se ordenan determin\u00edsticamente. Cada uno recibe un intervalo acumulativo proporcional a su balance. El winner wei cae en exactamente un intervalo \u2192 ese participante gana.',
      ref: '\u00a78',
    },
    cols: [
      {
        icon: '\ud83d\udcca',
        title: 'Interval mapping',
        text: 'Para un total elegible E: cada participante mapea a [sum_prev, sum_prev + balance). El winner wei selecciona el intervalo. M\u00e1s balance = m\u00e1s probabilidad, linealmente.',
        ref: '\u00a78',
      },
      {
        icon: '\ud83d\udcdd',
        title: 'Finalizaci\u00f3n on-chain',
        text: 'El operador llama finalizeWinner(raffleId, winner). El contrato registra al ganador. El operador NO elige arbitrariamente \u2014 solo relay\u00e9a el resultado reproducible.',
        ref: '\u00a74.2, \u00a79.5',
      },
    ],
    steps: [
      { num: 1, text: 'VRF fulfillment llega \u2192 winner wei almacenado on-chain' },
      { num: 2, text: 'Backend recupera eligibility artifact (ya commiteado por hash)' },
      { num: 3, text: 'Backend ordena participantes determin\u00edsticamente' },
      { num: 4, text: 'Backend construye interval mapping proporcional' },
      { num: 5, text: 'Backend localiza intervalo que contiene winner wei' },
      { num: 6, text: 'Operador llama finalizeWinner() con la address derivada' },
      { num: 7, text: 'Ronda pasa a Finished \u2014 premio reclamable por el ganador' },
    ],
  },

  reclamo: {
    icon: '\ud83c\udf81',
    title: 'Reclamo del premio',
    intro: 'El ganador reclama su premio llamando una funci\u00f3n de claim. Los premios son pull-based \u2014 no se env\u00edan autom\u00e1ticamente.',
    highlight: {
      label: 'Pull-based, no push',
      text: 'El ganador debe llamar una funci\u00f3n de claim, que puede batchar m\u00faltiples rondas finalizadas. El rafETH del premio se transfiere desde el vault (address(this)) al ganador. No es un nuevo mint \u2014 es transfer de shares ya reservadas.',
      ref: '\u00a712',
    },
    cols: [
      {
        icon: '\ud83d\udcb8',
        title: 'Premio en rafETH',
        text: 'Los premios se entregan en rafETH. Son balances ordinarios del vault. Cualquier efecto en elegibilidad futura es determinado off-chain por el procedimiento estricto.',
        ref: '\u00a76.3',
      },
      {
        icon: '\u23f0',
        title: 'Sin urgencia de claim',
        text: 'El claim no necesita ocurrir inmediatamente. Un ganador puede reclamar una ronda vieja despu\u00e9s de que rondas m\u00e1s nuevas ya hayan sido iniciadas, cerradas o finalizadas.',
        ref: '\u00a79.5',
      },
    ],
    states: [
      { state: 'Started', color: 'bg-accent', desc: 'Ronda abierta, aceptando participaci\u00f3n' },
      { state: 'Closed', color: 'bg-amber', desc: 'Cerrada, esperando VRF + derivaci\u00f3n' },
      { state: 'Finished', color: 'bg-green', desc: 'Ganador finalizado, premio reclamable' },
      { state: 'Claimed', color: 'bg-green/60', desc: 'Premio ya transferido al ganador' },
      { state: 'Discarded', color: 'bg-text-dim', desc: 'Sin surplus suficiente, sin ganador' },
    ],
  },

  redencion: {
    icon: '\ud83d\udcb1',
    title: 'Redenci\u00f3n del principal',
    intro: 'El usuario puede salir en cualquier momento quemando rafETH. Hay dos caminos de salida disponibles en v1.',
    highlight: {
      label: 'Dos modos de redenci\u00f3n',
      text: 'Path A: Delayed withdrawal \u2014 quema rafETH, inicia retiro contra Meta Pool, recibe ETH despu\u00e9s del periodo de espera.\nPath B: Direct spETH exit \u2014 quema rafETH, recibe spETH inmediatamente del vault.',
      ref: '\u00a76.4',
    },
    cols: [
      {
        icon: '\u23f3',
        title: 'Path A \u2014 Delayed ETH',
        text: 'El usuario quema rafETH. El vault inicia el withdrawal flow contra Meta Pool usando spETH de respaldo. StakeRaffle no gestiona el lifecycle del withdrawal despu\u00e9s de la iniciaci\u00f3n.',
        ref: '\u00a76.4',
      },
      {
        icon: '\u26a1',
        title: 'Path B \u2014 Direct spETH',
        text: 'El usuario quema rafETH. El vault transfiere el valor correspondiente en spETH directamente al usuario. Exit instant\u00e1neo pero el usuario recibe spETH, no ETH.',
        ref: '\u00a76.4',
      },
    ],
    callout: {
      label: 'Fuera de scope v1',
      text: 'No hay routing instant\u00e1neo de ETH a trav\u00e9s de liquidity pools externos dentro del contrato de raffle. Eso est\u00e1 expl\u00edcitamente fuera del scope de v1.',
      ref: '\u00a76.4, Out Of Scope',
      color: 'border-l-text-dim',
    },
  },
}

/* ── Sub-components ── */

function Highlight({ label, text, ref: specRef }) {
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 mb-6">
      <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
        {label} <span className="text-text-dim font-normal">| Spec {specRef}</span>
      </p>
      <p className="text-sm text-text leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  )
}

function InfoCol({ icon, title, text, ref: specRef, bold }) {
  let rendered = text
  if (bold) {
    const parts = text.split(bold)
    rendered = (
      <>
        {parts[0]}<strong className="underline">{bold}</strong>{parts[1]}
      </>
    )
  }
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h4 className="font-semibold mb-2">
        <span className="mr-2">{icon}</span>{title}
      </h4>
      <p className="text-sm text-text-dim leading-relaxed">{rendered}</p>
      {specRef && <p className="text-[10px] text-text-dim/60 mt-3">Spec {specRef}</p>}
    </div>
  )
}

function ActorBadge({ icon, name, desc }) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-lg px-4 py-3 border border-border">
      <span className="text-lg">{icon}</span>
      <div>
        <span className="text-sm font-semibold">{name}</span>
        <span className="text-text-dim text-sm"> &mdash; {desc}</span>
      </div>
    </div>
  )
}

function StepList({ steps }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border mt-4">
      <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Flujo paso a paso</h4>
      <div className="space-y-3">
        {steps.map(s => (
          <div key={s.num} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mt-0.5">
              {s.num}
            </span>
            <p className="text-sm text-text-dim leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EligibilityFlow({ flow }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border mt-4">
      <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Pipeline de elegibilidad</h4>
      <div className="flex flex-col gap-2">
        {flow.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="flex-shrink-0 text-xs font-mono bg-accent/15 text-accent px-2 py-1 rounded w-24 text-center">
              {f.step}
            </span>
            <span className="text-text-dim text-xs">{"\u2192"}</span>
            <p className="text-sm text-text-dim">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StateMachine({ states }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border mt-4">
      <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">{"M\u00e1quina de estados de ronda (spec \u00a710)"}</h4>
      <div className="space-y-2">
        {states.map(s => (
          <div key={s.state} className="flex items-center gap-3">
            <span className={`flex-shrink-0 w-3 h-3 rounded-full ${s.color}`} />
            <span className="text-sm font-mono font-semibold w-24">{s.state}</span>
            <p className="text-sm text-text-dim">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Callout({ label, text, ref: specRef, color = 'border-l-amber' }) {
  return (
    <div className={`bg-card rounded-xl p-5 border border-border border-l-4 ${color} mt-4`}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2">
        {label} <span className="text-text-dim font-normal">| Spec {specRef}</span>
      </p>
      <p className="text-sm text-text-dim leading-relaxed">{text}</p>
    </div>
  )
}

/* ── Main page ── */

export default function UserJourney() {
  const [active, setActive] = useState('onboarding')
  const d = DATA[active]

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-1">Journey del usuario &mdash; StakeRaffle v1</h2>
      <p className="text-text-dim text-sm mb-6">Recorrido completo desde el onboarding hasta la redenci&oacute;n, basado en el spec can&oacute;nico v1.</p>

      {/* Phase tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              active === p.id
                ? 'bg-accent text-white'
                : 'bg-card border border-border text-text-dim hover:text-text hover:bg-card-hover'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Phase header */}
      <div className="flex items-start gap-3 mb-5">
        <span className="text-3xl mt-0.5">{d.icon}</span>
        <div>
          <h3 className="text-xl font-bold">{d.title}</h3>
          <p className="text-sm text-text-dim mt-1 leading-relaxed">{d.intro}</p>
        </div>
      </div>

      {/* Highlight */}
      <Highlight label={d.highlight.label} text={d.highlight.text} ref={d.highlight.ref} />

      {/* Two-column info */}
      <div className="grid md:grid-cols-2 gap-4">
        {d.cols.map(c => (
          <InfoCol key={c.title} {...c} />
        ))}
      </div>

      {/* Optional: actors */}
      {d.actors && (
        <div className="bg-card/50 rounded-xl p-5 border border-border mt-5">
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-4">Actores del protocolo</h4>
          <div className="flex flex-wrap gap-2">
            {d.actors.map(a => (
              <ActorBadge key={a.name} {...a} />
            ))}
          </div>
        </div>
      )}

      {/* Optional: step list */}
      {d.steps && <StepList steps={d.steps} />}

      {/* Optional: eligibility flow */}
      {d.flow && <EligibilityFlow flow={d.flow} />}

      {/* Optional: state machine */}
      {d.states && <StateMachine states={d.states} />}

      {/* Optional: callout */}
      {d.callout && <Callout {...d.callout} />}
    </div>
  )
}
