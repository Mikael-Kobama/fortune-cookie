"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CookieCrack, CookieHalf, CookieWhole, Sparkle } from "./PixelCookie";
import { Slip } from "./Slip";
import { sfx } from "../lib/sfx";

// A animação é uma máquina de estados: cada fase vira um data-phase no palco,
// e o CSS (variantes group-data-* do Tailwind) decide o que cada peça faz.
type Phase = "boot" | "idle" | "shake" | "crack" | "break" | "slip" | "read";
type Reading = { fortune: string; lucky: number[]; resetsAt: number };

const ORDER: Phase[] = ["boot", "idle", "shake", "crack", "break", "slip", "read"];
const reached = (current: Phase, target: Phase) => ORDER.indexOf(current) >= ORDER.indexOf(target);

const STORAGE_KEY = "biscoito:v1";
const MUTE_KEY = "biscoito:mudo";

// duração de cada fase (ms). Tem que bater com as animações do globals.css
const T = { shake: 900, crack: 550, break: 800, slip: 900 } as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
};

// Migalhas: valores fixos (nada de Math.random no render, senão o servidor e o cliente discordam).
// dx = quanto vai pro lado, dy = altura do pulo, delay = atraso em ms
const CRUMBS = [
  { dx: -150, dy: -90, delay: 0, tone: "bg-crust-light" },
  { dx: -110, dy: -140, delay: 60, tone: "bg-crust-mid" },
  { dx: -70, dy: -110, delay: 20, tone: "bg-crust-dark" },
  { dx: -30, dy: -160, delay: 90, tone: "bg-crust-light" },
  { dx: 20, dy: -130, delay: 40, tone: "bg-crust-mid" },
  { dx: 60, dy: -170, delay: 0, tone: "bg-crust-light" },
  { dx: 100, dy: -100, delay: 80, tone: "bg-crust-dark" },
  { dx: 140, dy: -130, delay: 30, tone: "bg-crust-mid" },
  { dx: 170, dy: -70, delay: 70, tone: "bg-crust-light" },
  { dx: -170, dy: -50, delay: 50, tone: "bg-crust-dark" },
  { dx: -50, dy: -90, delay: 110, tone: "bg-crust-mid" },
  { dx: 40, dy: -80, delay: 10, tone: "bg-crust-dark" },
  { dx: 125, dy: -60, delay: 100, tone: "bg-crust-light" },
  { dx: -125, dy: -120, delay: 120, tone: "bg-crust-mid" },
];

const SPARKLES = [
  { pos: "-top-3 left-[6%]", size: "w-6", delay: "0ms" },
  { pos: "top-[8%] -right-2", size: "w-3", delay: "500ms" },
  { pos: "-bottom-2 left-[14%]", size: "w-3", delay: "900ms" },
  { pos: "-bottom-3 right-[10%]", size: "w-6", delay: "1300ms" },
];

export function FortuneCookie() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [reading, setReading] = useState<Reading | null>(null);
  const [instant, setInstant] = useState(false);
  const [error, setError] = useState(false);
  const [muted, setMuted] = useState(false);
  const [msLeft, setMsLeft] = useState(0);
  const busy = useRef(false);

  // Ao montar: som, e se esse visitante já abriu o biscoito de hoje, mostra ele direto.
  useEffect(() => {
    try {
      const isMuted = localStorage.getItem(MUTE_KEY) === "1";
      setMuted(isMuted);
      sfx.setMuted(isMuted);

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Reading;
        if (typeof saved.fortune === "string" && Array.isArray(saved.lucky) && saved.resetsAt > Date.now()) {
          setReading(saved);
          setInstant(true);
          setPhase("read");
          return;
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage bloqueado: segue sem memória, o servidor garante a mesma frase de qualquer jeito
    }
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    busy.current = false;
    setReading(null);
    setInstant(false);
    setPhase("idle");
  }, []);

  // contagem regressiva até o próximo biscoito; quando zera, volta pro começo
  useEffect(() => {
    if (phase !== "read" || !reading) return;
    const tick = () => {
      const left = reading.resetsAt - Date.now();
      if (left <= 0) return reset();
      setMsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, reading, reset]);

  const open = useCallback(async () => {
    if (busy.current || phase !== "idle") return;
    busy.current = true;
    setError(false);
    setPhase("shake");
    sfx.shake();

    // a requisição roda junto com a tremida: quando o biscoito quebrar, a frase já chegou
    const request = fetch("/api/fortune", { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json() as Promise<Reading>;
    });

    let data: Reading;
    try {
      [data] = await Promise.all([request, wait(T.shake)]);
    } catch {
      busy.current = false;
      setPhase("idle");
      setError(true);
      return;
    }

    setReading(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInstant(true);
      setPhase("read");
      return;
    }

    setPhase("crack");
    sfx.crack();
    await wait(T.crack);
    setPhase("break");
    sfx.snap();
    await wait(T.break);
    setPhase("slip");
    sfx.jingle();
    await wait(T.slip);
    setPhase("read");
  }, [phase]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sfx.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {}
  };

  const broken = reached(phase, "break");
  const slipOut = reached(phase, "slip");

  return (
    <section className="w-full">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={muted}
          className="cursor-pointer text-[10px] text-paper-shade hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
        >
          SOM: {muted ? "OFF" : "ON"}
        </button>
      </div>

      <div
        data-phase={phase}
        data-broken={broken}
        data-slip={slipOut}
        data-instant={instant}
        className="group/stage relative mx-auto h-[31rem] w-full max-w-md data-[phase=boot]:invisible"
      >
        {/* sombra no chão */}
        <div className="pixel-corners absolute bottom-14 left-1/2 h-3 w-48 -translate-x-1/2 bg-black/30 sm:w-64" />

        {/* papelzinho: nasce atrás do biscoito (z-0) e sobe pelo vão entre as metades */}
        <div className="absolute bottom-[16.5rem] left-1/2 z-0 w-[min(92%,22rem)] origin-bottom opacity-0 group-data-[slip=true]/stage:animate-slip-rise">
          <Slip
            text={reading?.fortune ?? ""}
            lucky={reading?.lucky ?? []}
            typing={phase === "read"}
            instant={instant}
          />
        </div>

        {/* o biscoito. 224px = 8x o sprite, 280px = 10x: escala inteira = pixel sem borrar */}
        <button
          type="button"
          onClick={open}
          disabled={phase !== "idle"}
          aria-label="Quebrar o biscoito da sorte"
          className="absolute bottom-[4.5rem] left-1/2 z-10 w-56 -translate-x-1/2 cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-8 focus-visible:outline-gold enabled:hover:brightness-110 disabled:cursor-default sm:w-70"
        >
          <span
            className={[
              "relative block aspect-[28/18]",
              "motion-safe:group-data-[phase=idle]/stage:animate-bob",
              "group-data-[phase=shake]/stage:animate-shake",
              "group-data-[phase=crack]/stage:animate-tremble group-data-[phase=crack]/stage:brightness-125",
            ].join(" ")}
          >
            {/* inteiro até quebrar */}
            <CookieWhole className="block h-full w-full group-data-[broken=true]/stage:hidden" />
            <CookieCrack className="absolute inset-0 h-full w-full opacity-0 group-data-[phase=crack]/stage:animate-crack-grow group-data-[broken=true]/stage:hidden" />

            {/* metades: escondidas até quebrar, aí cada uma cai pro seu lado */}
            <CookieHalf
              side="left"
              className="absolute inset-0 hidden h-full w-full origin-[25%_50%] group-data-[broken=true]/stage:block group-data-[broken=true]/stage:animate-split-left"
            />
            <CookieHalf
              side="right"
              className="absolute inset-0 hidden h-full w-full origin-[75%_50%] group-data-[broken=true]/stage:block group-data-[broken=true]/stage:animate-split-right"
            />

            {CRUMBS.map((c, i) => (
              <span
                key={i}
                className={`absolute top-1/2 left-1/2 size-2 opacity-0 group-data-[broken=true]/stage:animate-crumb ${c.tone}`}
                style={
                  {
                    "--dx": `${c.dx}px`,
                    "--dy": `${c.dy}px`,
                    animationDelay: `${c.delay}ms`,
                  } as CSSProperties
                }
              />
            ))}

            {/* brilhinhos, só enquanto espera o clique */}
            {SPARKLES.map((s, i) => (
              <Sparkle
                key={i}
                className={`absolute hidden ${s.pos} ${s.size} group-data-[phase=idle]/stage:block motion-safe:animate-twinkle`}
                style={{ animationDelay: s.delay }}
              />
            ))}
          </span>
        </button>
      </div>

      <p className="mt-2 min-h-10 text-center text-[10px] leading-loose">
        {error ? (
          <span className="text-lacquer">DEU RUIM NA COZINHA. TENTA DE NOVO.</span>
        ) : phase === "idle" ? (
          <span className="text-gold motion-safe:animate-blink">&gt; CLIQUE NO BISCOITO &lt;</span>
        ) : phase === "read" ? (
          <span className="text-paper-shade">próximo biscoito em {clock(msLeft)}</span>
        ) : null}
      </p>
    </section>
  );
}
