#!/usr/bin/env node
/**
 * Verificação do contrato do Desafio Diário contra um Postgres REAL via
 * Docker — a mesma SQL de `supabase/migrations/` que vai para o Supabase,
 * executada de ponta a ponta (incluindo o caminho da role `anon`).
 *
 * Requisitos: Docker em execução. Nada de projeto Supabase é necessário.
 *
 *   npm run verify:backend
 *
 * Também imprime os valores dourados do seed (para `supabase/contract.test.ts`)
 * e compara as fórmulas SQL com o espelho TS (`supabase/contract.ts`) —
 * qualquer divergência entre SQL e espelho falha a verificação.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Espelhos das fórmulas do contrato, duplicados aqui de propósito: o script
// roda em Node puro (sem type-stripping) e a fonte canônica é
// `supabase/contract.ts` (cujos valores dourados são travados em Jest).
function dailySeed(dateIso) {
  const hex = createHash('md5').update(dateIso).digest('hex').slice(0, 8);
  return parseInt(hex, 16) & 0x7fffffff;
}

function isoWeekStart(dateIso) {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dow);
  return date.toISOString().slice(0, 10);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const migrations = [
  join(root, 'supabase', 'migrations', '0001_daily_challenge.sql'),
  join(root, 'supabase', 'migrations', '0002_daily_challenge_access.sql'),
];
const IMAGE = 'postgres:16-alpine';
const CONTAINER = 'combo-forge-pg-verify';
const PORT = '54329';

let failures = 0;
function check(condition, message) {
  if (condition) {
    console.log(`  ok — ${message}`);
  } else {
    failures += 1;
    console.error(`  FAIL — ${message}`);
  }
}

function docker(args, options = {}) {
  return execFileSync('docker', args, { encoding: 'utf8', stdio: 'pipe', ...options });
}

function dockerQuiet(args) {
  try {
    docker(args, { stdio: 'ignore' });
  } catch {
    // container/volume inexistente: ignorado
  }
}

function psql(sql) {
  return docker(['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'combo_forge', '-v', 'ON_ERROR_STOP=1', '-t', '-A'], { input: sql }).trim();
}

/**
 * Comando único via -c. Com SET ROLE o psql imprime a tupla "SET" mesmo com
 * -t -A; descartamos essas linhas para comparar só o resultado real.
 */
function psqlCommand(sql) {
  const output = docker(['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'combo_forge', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql]).trim();
  return output
    .split('\n')
    .filter((line) => line.trim() !== 'SET' && line.trim() !== '')
    .join('\n');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDb() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      psql('select 1');
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error('Postgres não ficou pronto a tempo.');
}

try {
  console.log(`Subindo Postgres real (${IMAGE})...`);
  docker(['pull', IMAGE]);
  dockerQuiet(['rm', '-f', CONTAINER]);
  docker([
    'run', '-d', '--name', CONTAINER,
    '-e', 'POSTGRES_PASSWORD=postgres',
    '-e', 'POSTGRES_DB=combo_forge',
    '-p', `${PORT}:5432`,
    IMAGE,
  ]);
  await waitForDb();

  console.log('Aplicando migrations...');
  for (const file of migrations) {
    psql(readFileSync(file, 'utf8'));
  }

  console.log('\n1. Seed do dia (get_daily_seed)');
  const sampleDates = ['2026-08-11', '2026-08-12', '2026-01-01', '2024-02-29', '1970-01-01'];
  const sqlSeeds = {};
  for (const date of sampleDates) {
    const sqlValue = Number(psql(`select public.get_daily_seed('${date}')`));
    sqlSeeds[date] = sqlValue;
    check(Number.isInteger(sqlValue) && sqlValue >= 0 && sqlValue <= 2147483647, `seed de ${date} em [0, 2^31-1] (${sqlValue})`);
    check(sqlValue === dailySeed(date), `seed de ${date} === espelho TS (${sqlValue})`);
  }
  check(psql(`select public.get_daily_seed('${sampleDates[0]}')`) === psql(`select public.get_daily_seed('${sampleDates[0]}')`), 'determinístico: mesma data, mesmo seed');
  check(psql(`select public.get_daily_seed('${sampleDates[0]}')`) !== psql(`select public.get_daily_seed('${sampleDates[1]}')`), 'datas diferentes, seeds diferentes');

  console.log('\n   Valores dourados para supabase/contract.test.ts:');
  for (const [date, seed] of Object.entries(sqlSeeds)) {
    console.log(`   dailySeed('${date}') === ${seed}`);
  }

  console.log('\n2. Submissão (submit_daily_score)');
  check(psql(`select public.submit_daily_score('dev-a', 1200)`) === '1200', 'primeira submissão registra 1200');
  check(psql(`select public.submit_daily_score('dev-a', 300)`) === '1200', 're-submissão menor no mesmo dia mantém 1200');
  check(psql(`select public.submit_daily_score('dev-a', 1800)`) === '1800', 're-submissão maior no mesmo dia sobe para 1800');
  check(psql(`select count(*) from public.daily_submissions where device_id = 'dev-a'`) === '1', 'uma linha por (dia, device_id) — dev-a tem 1 linha');
  psql(`select public.submit_daily_score('dev-b', 900)`);
  check(psql(`select count(*) from public.daily_submissions where device_id = 'dev-b'`) === '1', 'dispositivos diferentes têm linhas separadas');
  let negativeRejected = false;
  try {
    psql(`select public.submit_daily_score('dev-a', -5)`);
  } catch {
    negativeRejected = true;
  }
  check(negativeRejected, 'score negativo é rejeitado pelo check constraint');

  console.log('\n3. Leaderboard semanal (get_weekly_leaderboard)');
  // Limpa o que a seção de submissão gravou no dia atual (cenário controlado).
  psql('truncate table public.daily_submissions');
  // Cenário fixo: semana ISO de 2026-08-10 (segunda) a 2026-08-16 (domingo).
  // dev-a: 1200 (seg) + 1800 (ter) → entra pelo melhor = 1800
  // dev-b: 900 (qua) | dev-c: 2000 (qui) | dev-d: 1500 (qui)
  // dev-old: 9999 na semana ANTERIOR (não pode aparecer)
  psql(`
    insert into public.daily_submissions (day, device_id, score) values
      ('2026-08-10', 'dev-a', 1200),
      ('2026-08-11', 'dev-a', 1800),
      ('2026-08-12', 'dev-b', 900),
      ('2026-08-13', 'dev-d', 1500),
      ('2026-08-13', 'dev-c', 2000),
      ('2026-08-07', 'dev-old', 9999),
      ('2026-08-17', 'dev-new', 3000)
  `);
  const lb = JSON.parse(psql(`select public.get_weekly_leaderboard('dev-a', '2026-08-13 12:00:00+00')`));
  check(lb.week === '2026-08-10', `semana começa na segunda ISO (${lb.week})`);
  check(lb.own.rank === 2 && lb.own.score === 1800, `posição própria: rank 2 com a melhor Run da semana (${JSON.stringify(lb.own)})`);
  check(lb.top.length === 4, 'top com 4 entradas na semana (sem dev-old e sem dev-new fora dela)');
  check(JSON.stringify(lb.top) === JSON.stringify([
    { rank: 1, score: 2000 },
    { rank: 2, score: 1800 },
    { rank: 3, score: 1500 },
    { rank: 4, score: 900 },
  ]), 'top ordenado por rank; dev-a entra uma vez, pelo melhor score');
  const noOwn = JSON.parse(psql(`select public.get_weekly_leaderboard('sem-pontos', '2026-08-13 12:00:00+00')`));
  check(noOwn.own === null, 'dispositivo sem pontuação na semana → own null');
  const sundayLb = JSON.parse(psql(`select public.get_weekly_leaderboard('dev-a', '2026-08-16 23:59:00+00')`));
  check(sundayLb.week === '2026-08-10', 'domingo ainda pertence à semana');
  const mondayLb = JSON.parse(psql(`select public.get_weekly_leaderboard('dev-old', '2026-08-17 00:00:00+00')`));
  check(mondayLb.week === '2026-08-17', 'segunda-feira seguinte inicia nova semana');
  check(mondayLb.own === null, 'submissão da semana anterior (dev-old) não vaza para a nova');
  const newWeekDev = JSON.parse(psql(`select public.get_weekly_leaderboard('dev-new', '2026-08-17 00:00:00+00')`));
  check(newWeekDev.own !== null && newWeekDev.own.score === 3000 && newWeekDev.own.rank === 1, 'nova semana considera só as submissões dela (dev-new rank 1)');
  check(isoWeekStart('2026-08-11') === '2026-08-10', 'janela semanal do espelho TS bate com a SQL');
  check(isoWeekStart('2026-08-16') === '2026-08-10', 'espelho TS: domingo na mesma semana');

  console.log('\n4. Acesso anônimo (RLS + grants da migration 0002)');
  check(psqlCommand(`set role anon; select public.get_daily_seed('2026-08-11')`) === String(sqlSeeds['2026-08-11']), 'anon consegue chamar get_daily_seed via RPC');
  check(psqlCommand(`set role anon; select public.submit_daily_score('anon-dev', 700)`) === '700', 'anon consegue submeter pontuação (security definer)');
  check(psqlCommand(`set role anon; select public.get_weekly_leaderboard('anon-dev', now())`).startsWith('{'), 'anon consegue consultar o leaderboard');
  let directDenied = false;
  try {
    psqlCommand(`set role anon; select * from public.daily_submissions`);
  } catch {
    directDenied = true;
  }
  check(directDenied, 'anon NÃO acessa a tabela diretamente (RLS sem políticas)');

  if (failures === 0) {
    console.log('\n✔ Contrato do Desafio Diário verificado contra Postgres real.');
  } else {
    console.error(`\n✘ ${failures} verificação(ões) falharam.`);
    process.exitCode = 1;
  }
} finally {
  dockerQuiet(['rm', '-f', CONTAINER]);
}
