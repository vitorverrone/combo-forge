# Backend Supabase — Desafio Diário

Contrato mínimo do Desafio Diário (ticket 12), conforme ADR 0001 (stack) e
ADR 0003 (seed completo, DDA desligado). Nada além disso vive no backend no
MVP: servir o seed do dia, receber submissões de pontuação e devolver o
leaderboard semanal (posição própria + top 10).

## Escopo e decisões

- **SQL-only via PostgREST** — sem Edge Functions. As três operações são
  funções Postgres expostas como endpoints RPC (`/rest/v1/rpc/…`).
- **Sem contas de usuário** (out of scope do MVP). Cada dispositivo gera um
  `device_id` (UUID opaco) persistido localmente (SQLite, ticket 11) e o
  backend deduplica por `(day, device_id)`.
- **Fronteira do dia: UTC.** Todos os jogadores veem o mesmo "dia" do Desafio
  Diário (`(now() at time zone 'utc')::date`).
- **Semana ISO (segunda a domingo).** O leaderboard semanal considera a
  MELHOR Run de cada dispositivo na semana (uma linha por dispositivo).
- **Empates compartilham rank** (classificação "competition": 1, 1, 3).
- **Identidade no leaderboard:** o top 10 expõe apenas `rank` e `score`
  (nunca device_id de terceiros); a posição própria vem no campo `own`.

## API (contrato)

Todos os endpoints são `POST /rest/v1/rpc/<função>` com a chave `anon`.

### `get_daily_seed`

| | |
|---|---|
| Parâmetros | `p_date` (opcional, `YYYY-MM-DD`; padrão: hoje em UTC) |
| Retorno | `integer` — semente da Run do dia, em `[0, 2^31-1]`, idêntica para todos |

```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_daily_seed" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{}'
# → 1828299912
```

Fórmula: `(('x' || substr(md5(to_char(p_date, 'YYYY-MM-DD')), 1, 8))::bit(32))::int & 2147483647`
(espelhada em `supabase/contract.ts` e travada por testes + verificação real;
`to_char` garante o formato ISO independente do `DateStyle` do banco).

### `submit_daily_score`

| | |
|---|---|
| Parâmetros | `p_device_id` (text), `p_score` (integer ≥ 0) |
| Retorno | `integer` — o melhor score armazenado para o dia do dispositivo |

Registra a pontuação da Run. Uma linha por `(day, device_id)`: re-submissões
no mesmo dia só sobem a pontuação (vale a melhor). A contagem de tentativas
(1 gratuita + 1 via anúncio) é do cliente (ticket 13).

```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/submit_daily_score" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"p_device_id": "<uuid-do-dispositivo>", "p_score": 2500}'
# → 2500
```

### `get_weekly_leaderboard`

| | |
|---|---|
| Parâmetros | `p_device_id` (text), `p_now` (opcional, timestamptz; padrão: agora) |
| Retorno | JSONB: `{ week, own, top }` |

```json
{
  "week": "2026-08-10",
  "own": { "rank": 2, "score": 1800 },
  "top": [
    { "rank": 1, "score": 2000 },
    { "rank": 2, "score": 1800 }
  ]
}
```

`own` é `null` se o dispositivo não pontuou na semana; `top` traz até 10
entradas (vazio se ninguém pontuou).

## Segurança

`supabase/migrations/0002_daily_challenge_access.sql`:
- As três funções são `SECURITY DEFINER` (rodam como dono) com
  `search_path` travado.
- A tabela tem RLS sem políticas: inacessível diretamente para qualquer role.
- O `anon` só tem `EXECUTE` nas três funções do contrato.

## Variáveis de ambiente

Veja `.env.example` na raiz. Nunca commitar `.env` (já ignorado):
`SUPABASE_URL` e `SUPABASE_ANON_KEY`. No cliente Expo/RN, use o prefixo
`EXPO_PUBLIC_` (ticket 13).

## Aplicar as migrations

Crie o projeto em https://supabase.com/dashboard e aplique os arquivos de
`supabase/migrations/` na ordem (0001 → 0002), via SQL editor ou CLI:

```bash
# com a CLI do Supabase (projeto vinculado)
supabase db push
```

## Verificação

- **Testes de unidade (sempre, sem Docker):** `npm test` — trava o contrato
  (valores dourados do seed + janela semanal) via o espelho TS.
- **Verificação contra Postgres real (requer Docker):**

  ```bash
  npm run verify:backend
  ```

  Sobe um Postgres 16 em contêiner, aplica as migrations, valida seed,
  submissão, leaderboard e o caminho `anon` (RLS) de ponta a ponta — e
  compara a SQL com o espelho TS, falhando em qualquer divergência.
