# Biscoito da Sorte

Um biscoito por dia, por visitante. Next.js (App Router) + Tailwind v4, tudo em pixel art feita em código.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Como funciona

**Frase do dia, sem banco de dados.** `lib/daily.ts` calcula a frase como função pura de `(IP, dia)`:
o hash do IP define onde o visitante começa na lista e o tamanho do "passo"; o dia (fuso de São Paulo)
avança esse passo. Mesmo IP + mesmo dia = mesma frase. O passo é coprimo com o tamanho da lista, então
nenhuma frase se repete antes de percorrer todas (com as 62 frases de hoje, são 62 dias sem repetir). O IP nunca é guardado, só entra no hash.

**Reset.** O "dia" vira à meia-noite de Brasília, igual Termo. Se quiser janela rolante de 24h
(24h depois da abertura, não da meia-noite), aí precisa guardar o horário da abertura: Upstash Redis / Vercel KV com TTL.

**Animação.** Uma máquina de estados em `components/FortuneCookie.tsx`
(`idle → shake → crack → break → read`) escreve a fase em `data-phase`; o CSS reage com variantes
`group-data-[...]` do Tailwind. Os keyframes ficam em `app/globals.css` e usam `steps(1)` com um keyframe
por quadro (~12 quadros por segundo nas metades, nas migalhas e no papelzinho). O papelzinho começa 500ms
depois do estalo, saindo pelo vão que as metades abrem; Se mudar a duração das animações no CSS, ajuste `T` e `SLIP_DELAY` em `FortuneCookie.tsx`. O sprite (`lib/sprite.ts`) é um grid desenhado por código; as metades da quebra
saem do mesmo grid cortado numa linha torta.

## Pra produção

- Defina `FORTUNE_SALT` nas variáveis de ambiente.
- O IP vem de `x-forwarded-for`. Só é confiável atrás de um proxy que sobrescreve esse header (Vercel faz isso).
- IPs compartilhados (CGNAT, escritório) recebem a mesma frase. É o custo de não ter conta/login.
- Mais frases = mais dias sem repetir: é só adicionar em `lib/fortunes.ts`.
