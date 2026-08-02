import { ComponentProps, For, Match, Switch } from "solid-js"

/* ═══════════════════════════════════════════
   ORBITAL PULSE — কেন্দ্রে বল, চারপাশে রিং ঘুরে
   ═══════════════════════════════════════════ */
function OrbitalPulse() {
  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.08" />
      <circle cx="7.5" cy="7.5" r="4.5" fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="5 22" stroke-linecap="round" class="spinner-orbital-ring" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" class="spinner-orbital-core" opacity="0.6" />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   FIREFLY — অনেকগুলো আলো এলোমেলো জ্বলে
   ═══════════════════════════════════════════ */
function Firefly() {
  const flies = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 360 + (i % 2 === 0 ? 15 : -15)
    const rad = (angle * Math.PI) / 180
    const r = 2.5 + (i % 3) * 1.2
    const dx = (Math.cos(rad) * 1.5).toFixed(2)
    const dy = (Math.sin(rad) * 1.5).toFixed(2)
    return {
      x: 7.5 + r * Math.cos(rad) * 0.5,
      y: 7.5 + r * Math.sin(rad) * 0.5,
      delay: (i / 8) * 1.6,
      dx, dy,
    }
  })

  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" stroke-width="0.3" opacity="0.08" />
      <For each={flies}>
        {(f) => (
          <circle
            cx={f.x}
            cy={f.y}
            r="0.5"
            fill="currentColor"
            class="spinner-firefly"
            style={{
              "animation-delay": `${f.delay}s`,
              "--ff-dx": `${f.dx}px`,
              "--ff-dy": `${f.dy}px`,
            }}
          />
        )}
      </For>
    </svg>
  )
}

/* ═══════════════════════════════════════════
   NEURAL NETWORK — node glow + line draw
   ═══════════════════════════════════════════ */
function NeuralNetwork() {
  const nodes = [
    { x: 7.5, y: 3 },
    { x: 11, y: 6 },
    { x: 10, y: 10.5 },
    { x: 5, y: 10.5 },
    { x: 4, y: 6 },
  ]
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
    [0, 2], [1, 3], [2, 4], [3, 0], [4, 1],
  ]

  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <For each={edges}>
        {([a, b]) => (
          <line
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="currentColor"
            stroke-width="0.3"
            class="spinner-neural-line"
            style={{ "animation-delay": `${(a + b) * 0.15}s` }}
          />
        )}
      </For>
      <For each={nodes}>
        {(n, i) => (
          <circle
            cx={n.x}
            cy={n.y}
            r="0.6"
            fill="currentColor"
            class="spinner-neural-node"
            style={{ "animation-delay": `${i() * 0.28}s` }}
          />
        )}
      </For>
    </svg>
  )
}

/* ═══════════════════════════════════════════
   DNA HELIX — দুটো strand ঘুরতে থাকে
   ═══════════════════════════════════════════ */
function DNAHelix() {
  const bridges = Array.from({ length: 5 }, (_, i) => ({
    y: 3 + i * 2.2,
    delay: i * 0.4,
  }))

  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <g class="spinner-dna-strand">
        <path d="M5 2 Q7.5 4.5 10 2 Q12.5 4.5 10 7 Q7.5 9.5 5 7 Q2.5 4.5 5 2" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
        <path d="M10 2 Q7.5 4.5 5 2 Q2.5 4.5 5 7 Q7.5 9.5 10 7 Q12.5 9.5 10 13" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.5" />
      </g>
      <For each={bridges}>
        {(b) => (
          <line x1="5.5" y1={b.y} x2="9.5" y2={b.y} stroke="currentColor" stroke-width="0.4" class="spinner-dna-bridge" style={{ "animation-delay": `${b.delay}s` }} />
        )}
      </For>
    </svg>
  )
}

/* ═══════════════════════════════════════════
   PARTICLE SWARM — কণাগুলো ঘুরে ঘুরে আসে
   ═══════════════════════════════════════════ */
function ParticleSwarm() {
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * 360
    const rad = (angle * Math.PI) / 180
    const r1 = 1 + (i % 3)
    const r2 = 2 + (i % 4)
    return {
      x: 7.5,
      y: 7.5,
      delay: (i / 10) * 1.8,
      dx: (Math.cos(rad) * r1).toFixed(2),
      dy: (Math.sin(rad) * r1).toFixed(2),
      dx2: (Math.cos(rad + 1) * r2).toFixed(2),
      dy2: (Math.sin(rad + 1) * r2).toFixed(2),
    }
  })

  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <For each={particles}>
        {(p) => (
          <circle
            cx={p.x}
            cy={p.y}
            r="0.4"
            fill="currentColor"
            class="spinner-particle"
            style={{
              "animation-delay": `${p.delay}s`,
              "--p-dx": `${p.dx}px`,
              "--p-dy": `${p.dy}px`,
              "--p-dx2": `${p.dx2}px`,
              "--p-dy2": `${p.dy2}px`,
            }}
          />
        )}
      </For>
    </svg>
  )
}

/* ═══════════════════════════════════════════
   LIQUID MORPH — তরল পদার্থের মতো shape বদলায়
   ═══════════════════════════════════════════ */
function LiquidMorph() {
  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <circle cx="7.5" cy="7.5" r="2" fill="currentColor" class="spinner-liquid" opacity="0.5" />
      <circle cx="7.5" cy="7.5" r="4" fill="none" stroke="currentColor" stroke-width="0.4" class="spinner-liquid" style={{ "animation-delay": "0.3s" }} opacity="0.3" />
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" stroke-width="0.3" class="spinner-liquid" style={{ "animation-delay": "0.6s" }} opacity="0.15" />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   RIPPLE — কেন্দ্র থেকে ঢেউ ছড়িয়ে
   ═══════════════════════════════════════════ */
function Ripple() {
  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="7.5" cy="7.5" r="1" fill="none" stroke="currentColor" stroke-width="0.5" class="spinner-ripple" />
      <circle cx="7.5" cy="7.5" r="1" fill="none" stroke="currentColor" stroke-width="0.4" class="spinner-ripple" style={{ "animation-delay": "0.5s" }} />
      <circle cx="7.5" cy="7.5" r="1" fill="none" stroke="currentColor" stroke-width="0.3" class="spinner-ripple" style={{ "animation-delay": "1s" }} />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   PULSE RING — classic but sexier
   ═══════════════════════════════════════════ */
function PulseRing() {
  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" stroke-width="0.8" stroke-dasharray="6 20" stroke-linecap="round" class="spinner-pulse-ring" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" class="spinner-pulse-core" opacity="0.4" />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   ENERGY WAVE — তরঙ্গ আকারে ঘুরে
   ═══════════════════════════════════════════ */
function EnergyWave() {
  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 30" class="spinner-wave" />
      <circle cx="7.5" cy="7.5" r="4" fill="none" stroke="currentColor" stroke-width="0.6" stroke-dasharray="3 20" class="spinner-wave" style={{ "animation-delay": "0.4s" }} opacity="0.5" />
      <circle cx="7.5" cy="7.5" r="2" fill="currentColor" opacity="0.3" class="spinner-orbital-core" />
    </svg>
  )
}

/* ═══════════════════════════════════════════
   QUANTUM DOT — কোয়ান্টাম ফ্লাকচুয়েশন
   ═══════════════════════════════════════════ */
function QuantumDot() {
  const dots = Array.from({ length: 5 }, (_, i) => ({
    x: 7.5 + (i - 2) * 1.5,
    y: 7.5,
    delay: i * 0.16,
  }))

  return (
    <svg viewBox="0 0 15 15" data-component="spinner">
      <For each={dots}>
        {(d) => (
          <circle cx={d.x} cy={d.y} r="0.5" fill="currentColor" class="spinner-quantum" style={{ "animation-delay": `${d.delay}s` }} />
        )}
      </For>
    </svg>
  )
}

/* ═══════════════════════════════════════════
   MAIN SPINNER — default = OrbitalPulse
   ═══════════════════════════════════════════ */
export function Spinner(props: {
  class?: string
  classList?: ComponentProps<"div">["classList"]
  style?: ComponentProps<"div">["style"]
  variant?: "orbital" | "firefly" | "neural" | "dna" | "particle" | "liquid" | "ripple" | "pulse" | "wave" | "quantum"
}) {
  const variant = props.variant ?? "orbital"

  return (
    <div
      {...props}
      data-component="spinner"
      classList={{
        ...props.classList,
        [props.class ?? ""]: !!props.class,
      }}
      style={{ width: "18px", height: "18px", "flex-shrink": "0", ...((props.style as Record<string, string>) ?? {}) }}
    >
      <Switch>
        <Match when={variant === "firefly"}><Firefly /></Match>
        <Match when={variant === "neural"}><NeuralNetwork /></Match>
        <Match when={variant === "dna"}><DNAHelix /></Match>
        <Match when={variant === "particle"}><ParticleSwarm /></Match>
        <Match when={variant === "liquid"}><LiquidMorph /></Match>
        <Match when={variant === "ripple"}><Ripple /></Match>
        <Match when={variant === "pulse"}><PulseRing /></Match>
        <Match when={variant === "wave"}><EnergyWave /></Match>
        <Match when={variant === "quantum"}><QuantumDot /></Match>
        <Match when={variant === "orbital"}><OrbitalPulse /></Match>
      </Switch>
    </div>
  )
}
