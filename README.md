# NETLAB

Plataforma de estudo de redes — roteamento IP, comutação e redes sem fio —
com aulas, simuladores operáveis e laboratórios corrigidos. Em pt-BR.

Next 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui.

## Rodando

```bash
npm install
npm run dev          # http://localhost:3000
```

## Verificação

```bash
npm run typecheck
npm run lint
npm run test:unit    # matemática de redes, sem browser
npm run test:e2e     # sobe o build em 3100 e roda Playwright + axe
node scripts/contraste.mjs   # obrigatório ao mexer em cor
```

`npm run test` roda os dois conjuntos de teste em sequência.

## Onde estão as coisas

- `lib/net/` — toda a matemática de redes, pura e testada. Componentes só
  apresentam; nenhuma conta vive dentro de JSX.
- `lib/content/` — currículo, aulas, glossário, quiz e laboratórios. Cada
  item declara sua proveniência (`source`), e o selo deriva daí.
- `components/netlab/` — as peças do produto; `components/ui/` é shadcn.

Ao mexer em cor, rode `scripts/contraste.mjs` antes de commitar: ele lê
`app/globals.css` direto e falha se algum par cair abaixo de 4,5:1.
