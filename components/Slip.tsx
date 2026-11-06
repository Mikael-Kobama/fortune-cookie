"use client";

import { useEffect, useState } from "react";
import { sfx } from "../lib/sfx";

type Props = {
  text: string;
  lucky: number[];
  /** true quando o papel já abriu e pode começar a "digitar" */
  typing: boolean;
  /** pula a digitação (biscoito já aberto hoje) */
  instant: boolean;
};

export function Slip({ text, lucky, typing, instant }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!typing) {
      setShown(0);
      return;
    }
    if (instant) {
      setShown(text.length);
      return;
    }

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i % 2 === 0 && text[i - 1] !== " ") sfx.tick();
      if (i >= text.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [typing, instant, text]);

  const done = typing && text.length > 0 && shown >= text.length;

  return (
    // drop-shadow fica num wrapper porque o clip-path do filho cortaria a sombra
    <div className="drop-shadow-[4px_4px_0_rgb(0_0_0/0.45)]">
      <div className="pixel-corners bg-ink p-1">
        <div className="pixel-corners bg-paper px-5 py-5 text-ink">
          <p className="mb-3 flex items-center gap-2 text-[8px] text-lacquer">
            <span className="h-1 flex-1 bg-paper-shade" />
            SUA SORTE
            <span className="h-1 flex-1 bg-paper-shade" />
          </p>

          {/* o texto inteiro fica invisível só pra reservar o espaço; o digitado vai por cima */}
          <p className="relative text-[11px] leading-[1.9]">
            <span className="invisible">{text}</span>
            <span aria-hidden="true" className="absolute inset-0">
              {text.slice(0, shown)}
              {!done && (
                <span className="ml-0.5 inline-block h-[1em] w-[0.6em] translate-y-[0.15em] bg-ink motion-safe:animate-blink" />
              )}
            </span>
          </p>
          <p className="sr-only" aria-live="polite">
            {typing ? text : ""}
          </p>

          <div className={`mt-4 flex flex-wrap items-center gap-2 text-[9px] ${done ? "" : "invisible"}`}>
            <span className="w-full text-lacquer">números da sorte:</span>
            {lucky.map((n) => (
              <span key={n} className="bg-ink px-1.5 py-1 text-gold">
                {String(n).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
