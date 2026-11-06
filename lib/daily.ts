import { createHash } from "node:crypto";
import { FORTUNES } from "./fortunes";

const TZ = "America/Sao_Paulo";

// Sal só pra ninguém conseguir prever a frase de um IP lendo o código.
// Em produção: defina FORTUNE_SALT nas variáveis de ambiente.
const SALT = process.env.FORTUNE_SALT ?? "dev-salt-troque-em-producao";

export type DailyFortune = {
  fortune: string;
  lucky: number[];
  /** timestamp (ms) de quando o próximo biscoito libera */
  resetsAt: number;
};

// Que dia/hora é agora em São Paulo? (o "dia" vira à meia-noite daqui, igual o Termo)
function spClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);

  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    secsSinceMidnight: get("hour") * 3600 + get("minute") * 60 + get("second"),
  };
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Passo coprimo com o tamanho da lista: andando de "passo em passo" pelo array,
// a gente só volta a uma frase repetida depois de percorrer a lista inteira.
function pickStep(seed: number, n: number): number {
  const coprimes = Array.from({ length: n }, (_, i) => i + 1).filter(
    (s) => gcd(s, n) === 1,
  );
  return coprimes[seed % coprimes.length];
}

/**
 * Sem banco de dados: a frase do dia é uma função pura de (IP, dia).
 * Mesmo IP + mesmo dia = mesma frase, sempre. Dia seguinte = outra.
 * O IP nunca é guardado nem logado, só entra no hash.
 */
export function dailyFortune(ip: string, now = new Date()): DailyFortune {
  const { y, m, d, secsSinceMidnight } = spClock(now);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);

  // "assinatura" do visitante: define onde ele começa na lista e o passo
  const who = createHash("sha256").update(`${SALT}|${ip}`).digest();
  const n = FORTUNES.length;
  const start = who.readUInt32BE(0) % n;
  const step = pickStep(who.readUInt32BE(4), n);
  const fortune = FORTUNES[(start + step * dayNumber) % n];

  // números da sorte (6 de 60, tipo Mega-Sena): mudam todo dia
  const today = createHash("sha256").update(`${SALT}|${ip}|${dayNumber}`).digest();
  const lucky = new Set<number>();
  for (const byte of today) {
    lucky.add((byte % 60) + 1);
    if (lucky.size === 6) break;
  }

  const msLeft = (86_400 - secsSinceMidnight) * 1000 - now.getMilliseconds();

  return {
    fortune,
    lucky: [...lucky].sort((a, b) => a - b),
    resetsAt: now.getTime() + msLeft,
  };
}
