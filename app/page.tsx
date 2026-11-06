import { FortuneCookie } from "../components/FortuneCookie";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl leading-tight text-gold [text-shadow:4px_4px_0_var(--color-lacquer)] sm:text-4xl">
          BISCOITO
          <br />
          DA SORTE
        </h1>
        <p className="mt-6 text-[10px] leading-relaxed text-paper-shade">
          um por dia. só um.
        </p>
      </header>

      <div className="mt-6 w-full flex-1">
        <FortuneCookie />
      </div>

      <footer className="mt-8 text-center text-[8px] leading-loose text-paper-shade/70">
        o biscoito novo chega à meia-noite
        <br />
        (horário de brasília)
      </footer>
    </main>
  );
}
