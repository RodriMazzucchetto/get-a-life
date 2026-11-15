# Rootmap

Opportunity Solution Tree para o dia a dia.

**Hierarquia:** Objetivo → Problema / Oportunidade → Solução → Task  
**Prioridade em cada nível:** ordem · ★ foco (um por nível) · agora / próximo / depois

## Stack

- Next.js + TypeScript + Tailwind
- Supabase (projeto **GTD 2.0**)
- Deploy Vercel (**get-a-life**)

## App

- `/foco` — foco ★ por objetivo + fila de tasks
- `/arvores` — árvore expandível
- `/objetivos` — lista de outcomes (1 por empresa)
- Cartões: oportunidade, solução (premissas), task (entrega / teste)

Loop de discovery: premissas na solução · tasks tipo **Teste** · resultado atualiza premissa e vira evidência no problema.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # ou: vercel env pull
npm run dev
```

## Arquivo do produto antigo

O framework anterior (OS / pilares / apostas / Pessoal / Relatórios / ciclos) está em `src/_archive/` — **não deletado**, para reaproveitar depois.

Design source do Rootmap: `design/rootmap-mock/`.
