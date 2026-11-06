import {
  SPRITE_H,
  SPRITE_W,
  crackRuns,
  runs,
  type Run,
  type Side,
  type Tone,
} from "../lib/sprite";

// Classes literais de propósito: o Tailwind só gera o que enxerga escrito no código.
const FILL: Record<Tone, string> = {
  o: "fill-crust-outline",
  s: "fill-crust-crease",
  d: "fill-crust-dark",
  m: "fill-crust-mid",
  l: "fill-crust-light",
};

const VIEW_BOX = `0 0 ${SPRITE_W} ${SPRITE_H}`;

function Pixels({ list }: { list: Run[] }) {
  return (
    <>
      {list.map((r) => (
        <rect
          key={`${r.x}:${r.y}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          className={FILL[r.tone]}
        />
      ))}
    </>
  );
}

// crispEdges = nada de borrar as bordas dos pixels
export function CookieWhole({ className }: { className?: string }) {
  return (
    <svg viewBox={VIEW_BOX} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <Pixels list={runs("all")} />
    </svg>
  );
}

export function CookieHalf({ side, className }: { side: Exclude<Side, "all">; className?: string }) {
  return (
    <svg viewBox={VIEW_BOX} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <Pixels list={runs(side)} />
    </svg>
  );
}

export function CookieCrack({ className }: { className?: string }) {
  return (
    <svg viewBox={VIEW_BOX} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <Pixels list={crackRuns()} />
    </svg>
  );
}

// estrelinha de 3x3 pixels (uma cruz)
export function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 3 3"
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M1 0h1v3H1zM0 1h3v1H0z" className="fill-gold" />
    </svg>
  );
}
