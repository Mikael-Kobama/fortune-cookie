// O biscoito é desenhado em código: uma elipse, sombreado de um lado, uma dobra
// e uns pontinhos de torrado. Cada célula vira um "pixel" no SVG.
// Nada de imagem, nada de emoji.

export const SPRITE_W = 28;
export const SPRITE_H = 18;

// o = contorno, s = dobra, d = escuro, m = médio, l = claro
export type Tone = "o" | "s" | "d" | "m" | "l";
export type Side = "all" | "left" | "right";
export type Run = { x: number; y: number; w: number; tone: Tone };

const inside = (x: number, y: number): boolean => {
  const nx = (x + 0.5 - SPRITE_W / 2) / (SPRITE_W / 2);
  const ny = (y + 0.5 - SPRITE_H / 2) / (SPRITE_H / 2);
  return nx * nx + ny * ny <= 1;
};

// Ruído em aritmética inteira (0 a 99). Nada de Math.sin/Math.random aqui:
// servidor e navegador precisam desenhar exatamente o mesmo biscoito.
const noise = (x: number, y: number): number => {
  let h = Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) % 100;
};

function paint(x: number, y: number): Tone | null {
  if (!inside(x, y)) return null;

  const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
  if (edge) return "o";

  // dobra: uma diagonal que divide o biscoito em dois "gomos"
  if (Math.abs(x - (7 + y * 0.75)) < 0.8 && y > 2 && y < SPRITE_H - 3) return "s";

  // luz vindo de cima à esquerda
  const light = ((x - SPRITE_W / 2) * 0.6 + (y - SPRITE_H / 2)) / 12;
  let tone: Tone = light < -0.5 ? "l" : light > 0.45 ? "d" : "m";

  // pontinhos mais torrados / mais claros, pra não parecer carimbo
  const r = noise(x, y);
  if (r > 93) tone = tone === "l" ? "m" : "d";
  else if (r < 5) tone = tone === "d" ? "m" : "l";

  return tone;
}

const SPRITE: (Tone | null)[][] = Array.from({ length: SPRITE_H }, (_, y) =>
  Array.from({ length: SPRITE_W }, (_, x) => paint(x, y)),
);

// Onde o biscoito parte. Uma linha torta (não reta) pra parecer quebra de verdade.
// Um valor por linha do sprite (SPRITE_H = 18).
const ZIG = [0, 1, 0, -1, -1, 0, 1, 1, 0, -1, 0, 1, 0, -1, -1, 0, 1, 0];
const splitX = (y: number): number => SPRITE_W / 2 + ZIG[y];

function cell(x: number, y: number, side: Side): Tone | null {
  const tone = SPRITE[y][x];
  if (!tone || side === "all") return tone;

  const cut = splitX(y);
  if (side === "left") {
    if (x >= cut) return null;
    return x === cut - 1 && tone !== "o" ? "s" : tone; // borda da quebra fica mais escura
  }
  if (x < cut) return null;
  return x === cut && tone !== "o" ? "s" : tone;
}

// Junta pixels vizinhos da mesma cor numa linha só: menos <rect> no DOM.
export function runs(side: Side): Run[] {
  const out: Run[] = [];
  for (let y = 0; y < SPRITE_H; y++) {
    let x = 0;
    while (x < SPRITE_W) {
      const tone = cell(x, y, side);
      if (!tone) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < SPRITE_W && cell(x + w, y, side) === tone) w++;
      out.push({ x, y, w, tone });
      x += w;
    }
  }
  return out;
}

// A rachadura que aparece antes de partir: mesma linha torta do corte.
export function crackRuns(): Run[] {
  const out: Run[] = [];
  for (let y = 0; y < SPRITE_H; y++) {
    const x = splitX(y) - 1;
    if (SPRITE[y][x] && SPRITE[y][x + 1]) out.push({ x, y, w: 2, tone: "o" });
  }
  return out;
}
