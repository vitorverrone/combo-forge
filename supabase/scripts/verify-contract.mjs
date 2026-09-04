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

// Espelho da validação de set_display_name, duplicado aqui pela mesma razão
// das fórmulas acima — fonte canônica é engine/displayName.ts.
const DISPLAY_NAME_CHARSET_REGEX =
  /^[a-zA-Z0-9 ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ]+$/;
const PROHIBITED_DISPLAY_NAME_TERMS = [
  'porra', 'caralho', 'merda', 'buceta', 'cacete', 'piroca', 'cuzao',
  'arrombado', 'arrombada', 'punheta', 'xoxota', 'putinha', 'corno',
  'fdp', 'desgracado', 'desgracada', 'viadinho', 'bosta',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'whore',
  'faggot', 'nigger', 'nigga', 'motherfucker', 'dickhead', 'slut',
  'retard', 'pussy',
];
function validateDisplayName(rawName) {
  const name = rawName.trim();
  if (name.length < 3) return { valid: false, reason: 'tooShort' };
  if (name.length > 16) return { valid: false, reason: 'tooLong' };
  if (!DISPLAY_NAME_CHARSET_REGEX.test(name)) return { valid: false, reason: 'invalidChars' };
  const lower = name.toLowerCase();
  if (PROHIBITED_DISPLAY_NAME_TERMS.some((term) => lower.includes(term))) {
    return { valid: false, reason: 'profanity' };
  }
  return { valid: true };
}

// Espelho da resolução de Tier da Liga (ADR 0010, ticket 02), duplicado aqui
// pela mesma razão das fórmulas acima — fonte canônica é supabase/contract.ts.
const LEAGUE_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
function promoteLeagueTier(tier) {
  const i = LEAGUE_TIERS.indexOf(tier);
  return LEAGUE_TIERS[Math.min(LEAGUE_TIERS.length - 1, i + 1)];
}
function demoteLeagueTier(tier) {
  const i = LEAGUE_TIERS.indexOf(tier);
  return LEAGUE_TIERS[Math.max(0, i - 1)];
}
function resolveLeagueTierFromDivision(previousTier, positionInDivision, actualDivisionSize, zoneSize = 5) {
  if (positionInDivision <= zoneSize) return promoteLeagueTier(previousTier);
  if (positionInDivision > actualDivisionSize - zoneSize) return demoteLeagueTier(previousTier);
  return previousTier;
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const migrations = [
  join(root, 'supabase', 'migrations', '0001_daily_challenge.sql'),
  join(root, 'supabase', 'migrations', '0002_daily_challenge_access.sql'),
  join(root, 'supabase', 'migrations', '0003_display_name.sql'),
  join(root, 'supabase', 'migrations', '0004_league.sql'),
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

  console.log('\n2. Nome de Exibição (set_display_name + players)');
  // Compara a lista de termos proibidos inteira (não só o resultado de
  // alguns nomes de amostra) — pega drift entre o SQL e o espelho TS que os
  // testes de aceitar/rejeitar abaixo, sozinhos, não pegariam.
  const sqlTerms = JSON.parse(psql(`select to_jsonb(public._display_name_prohibited_terms())`));
  check(
    JSON.stringify([...sqlTerms].sort()) === JSON.stringify([...PROHIBITED_DISPLAY_NAME_TERMS].sort()),
    `lista de termos proibidos SQL === espelho TS, sem drift (${sqlTerms.length} termos)`,
  );
  check(psql(`select public.set_display_name('dev-name-1', 'Fulano')`) === 'Fulano', 'nome válido é salvo e devolvido');
  check(psql(`select display_name from public.players where device_id = 'dev-name-1'`) === 'Fulano', 'persistido na tabela players');
  check(psql(`select public.set_display_name('dev-name-1', 'Beltrano')`) === 'Beltrano', 'upsert troca o nome do mesmo dispositivo');
  check(psql(`select count(*) from public.players where device_id = 'dev-name-1'`) === '1', 'upsert não duplica linha');
  check(psql(`select public.set_display_name('dev-name-2', 'Fulano')`) === 'Fulano', 'nome duplicado entre dispositivos é permitido (sem checagem de unicidade)');
  check(psql(`select public.set_display_name('dev-name-3', '  Espacado  ')`) === 'Espacado', 'espaços nas pontas são cortados (trim) antes de validar e salvar');
  check(psql(`select public.set_display_name('dev-accent', 'José Ção')`) === 'José Ção', 'acentuação pt-br é aceita');

  const rejectionCases = [
    ['ab', 'tooShort'],
    ['a'.repeat(17), 'tooLong'],
    ['Nome😀', 'invalidChars'],
    ['Nome!', 'invalidChars'],
    ['seu merda', 'profanity'],
    ['fuck you', 'profanity'],
  ];
  for (const [name, expectedReason] of rejectionCases) {
    const mirror = validateDisplayName(name);
    check(mirror.valid === false && mirror.reason === expectedReason, `espelho TS rejeita "${name}" por ${expectedReason}`);
    let rejected = false;
    try {
      psql(`select public.set_display_name('dev-bad', '${name.replace(/'/g, "''")}')`);
    } catch {
      rejected = true;
    }
    check(rejected, `SQL rejeita "${name}" (${expectedReason})`);
  }
  check(psql(`select count(*) from public.players where device_id = 'dev-bad'`) === '0', 'nenhuma das tentativas rejeitadas foi persistida');

  console.log('\n3. Submissão (submit_daily_score)');
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

  console.log('\n4. Leaderboard semanal (get_weekly_leaderboard)');
  // Limpa o que a seção de submissão gravou no dia atual (cenário controlado).
  psql('truncate table public.daily_submissions');
  // Cenário fixo: semana ISO de 2026-08-10 (segunda) a 2026-08-16 (domingo).
  // dev-a: 1200 (seg) + 1800 (ter) → entra pelo melhor = 1800
  // dev-b: 900 (qua) | dev-c: 2000 (qui) | dev-d: 1500 (qui)
  // dev-old: 9999 na semana ANTERIOR (não pode aparecer)
  // dev-a e dev-c têm Nome de Exibição cadastrado; dev-b e dev-d não — o
  // leaderboard precisa devolver name: null pra quem ainda não cadastrou.
  psql(`select public.set_display_name('dev-a', 'Ana')`);
  psql(`select public.set_display_name('dev-c', 'Carlos')`);
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
  check(lb.own.rank === 2 && lb.own.score === 1800 && lb.own.name === 'Ana', `posição própria: rank 2, nome "Ana" (${JSON.stringify(lb.own)})`);
  check(lb.top.length === 4, 'top com 4 entradas na semana (sem dev-old e sem dev-new fora dela)');
  // Checagem campo a campo (não JSON.stringify posicional): jsonb não
  // garante a ordem das chaves de cada objeto na saída — só a ordem dos
  // elementos do array (essa sim preservada por jsonb_agg).
  const expectedTop = [
    { rank: 1, score: 2000, name: 'Carlos' },
    { rank: 2, score: 1800, name: 'Ana' },
    { rank: 3, score: 1500, name: null },
    { rank: 4, score: 900, name: null },
  ];
  check(
    expectedTop.every((expected, i) =>
      lb.top[i]?.rank === expected.rank && lb.top[i]?.score === expected.score && lb.top[i]?.name === expected.name,
    ),
    `top ordenado por rank, com nome (null pra quem não cadastrou) (${JSON.stringify(lb.top)})`,
  );
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

  console.log('\n5. Acesso anônimo (RLS + grants das migrations 0002/0003)');
  check(psqlCommand(`set role anon; select public.get_daily_seed('2026-08-11')`) === String(sqlSeeds['2026-08-11']), 'anon consegue chamar get_daily_seed via RPC');
  check(psqlCommand(`set role anon; select public.submit_daily_score('anon-dev', 700)`) === '700', 'anon consegue submeter pontuação (security definer)');
  check(psqlCommand(`set role anon; select public.get_weekly_leaderboard('anon-dev', now())`).startsWith('{'), 'anon consegue consultar o leaderboard');
  check(psqlCommand(`set role anon; select public.set_display_name('anon-dev', 'Anonimo')`) === 'Anonimo', 'anon consegue definir o Nome de Exibição (security definer)');
  let directDenied = false;
  try {
    psqlCommand(`set role anon; select * from public.daily_submissions`);
  } catch {
    directDenied = true;
  }
  check(directDenied, 'anon NÃO acessa daily_submissions diretamente (RLS sem políticas)');
  let playersDirectDenied = false;
  try {
    psqlCommand(`set role anon; select * from public.players`);
  } catch {
    playersDirectDenied = true;
  }
  check(playersDirectDenied, 'anon NÃO acessa players diretamente (RLS sem políticas)');

  console.log('\n6. Liga (get_league_leaderboard, ADR 0010, ticket 02)');
  const belowThreshold = JSON.parse(psql(`select public.get_league_leaderboard('dev-a', '2026-08-13 12:00:00+00')`));
  check(belowThreshold.active === false, 'abaixo da massa crítica (poucos participantes na semana) → active: false');

  // Massa crítica: 300 dispositivos genéricos pontuando na semana de
  // 2026-08-31 (segunda) — liga a Liga só pra essa semana em diante.
  psql(`
    insert into public.daily_submissions (day, device_id, score)
    select '2026-08-31'::date, 'bulk-' || i, 100 + i
    from generate_series(1, 300) as i
  `);

  const newDevice = JSON.parse(psql(`select public.get_league_leaderboard('dev-lg-new', '2026-08-31 12:00:00+00')`));
  check(newDevice.active === true, 'acima da massa crítica → active: true');
  check(newDevice.tier === 'bronze', 'dispositivo novo (sem posicionamento anterior) sempre entra em bronze');
  check(newDevice.division === null && newDevice.own === null, 'sem pontuação na semana atual → division/own null (dispositivo não jogou ainda)');
  check(JSON.stringify(newDevice.top) === '[]', 'sem own, a Divisão não pode ser calculada → top vazio');

  // Cenário de promoção/rebaixamento: 13 dispositivos no Tier 'silver' na
  // semana anterior (2026-08-24), incluindo um empate exato na posição 5
  // (dev-lg-5 e dev-lg-5b) — testa "todos os empatados sobem juntos" (mais
  // de 5 promovidos) e a zona "no meio" (fica no mesmo Tier) numa Divisão
  // pequena (13, não os ~30 de produção — a matemática é a mesma).
  const prevWeekScores = [
    ['dev-lg-1', 1200], ['dev-lg-2', 1100], ['dev-lg-3', 1000], ['dev-lg-4', 900],
    ['dev-lg-5', 800], ['dev-lg-5b', 800],
    ['dev-lg-6', 700], ['dev-lg-7', 600],
    ['dev-lg-8', 500], ['dev-lg-9', 400], ['dev-lg-10', 300], ['dev-lg-11', 200], ['dev-lg-12', 100],
  ];
  for (const [deviceId] of prevWeekScores) {
    psql(`insert into public.league_placements (device_id, week, tier) values ('${deviceId}', '2026-08-24', 'silver')`);
  }
  psql(`
    insert into public.daily_submissions (day, device_id, score) values
    ${prevWeekScores.map(([deviceId, score]) => `('2026-08-24', '${deviceId}', ${score})`).join(',\n    ')}
  `);
  // Cada um pontua também na semana atual (2026-08-31), senão own/division
  // ficariam null (mesma regra do dispositivo novo acima) — a pontuação
  // desta semana não influencia a promoção/rebaixamento, só a da anterior.
  psql(`
    insert into public.daily_submissions (day, device_id, score) values
    ${prevWeekScores.map(([deviceId, score]) => `('2026-08-31', '${deviceId}', ${score})`).join(',\n    ')}
  `);

  // Posição = rank "competition" (empates compartilham; o próximo rank
  // distinto pula os números do empate) — calculada à mão a partir dos
  // scores acima, não derivada do índice do array (índice e rank divergem a
  // partir do empate dev-lg-5/dev-lg-5b).
  const devicePositions = {
    'dev-lg-1': 1, 'dev-lg-2': 2, 'dev-lg-3': 3, 'dev-lg-4': 4,
    'dev-lg-5': 5, 'dev-lg-5b': 5,
    'dev-lg-6': 7, 'dev-lg-7': 8,
    'dev-lg-8': 9, 'dev-lg-9': 10, 'dev-lg-10': 11, 'dev-lg-11': 12, 'dev-lg-12': 13,
  };
  const expectedTiers = Object.fromEntries(
    Object.entries(devicePositions).map(([deviceId, position]) => [
      deviceId,
      resolveLeagueTierFromDivision('silver', position, prevWeekScores.length),
    ]),
  );
  for (const [deviceId, expectedTier] of Object.entries(expectedTiers)) {
    const standing = JSON.parse(psql(`select public.get_league_leaderboard('${deviceId}', '2026-08-31 12:00:00+00')`));
    check(
      standing.tier === expectedTier,
      `${deviceId} (posição ${devicePositions[deviceId]}): Tier resolvido = ${standing.tier} (esperado ${expectedTier})`,
    );
  }
  check(expectedTiers['dev-lg-5'] === 'gold' && expectedTiers['dev-lg-5b'] === 'gold', 'empate exato na fronteira (ambos posição 5): os dois dispositivos empatados sobem juntos');
  check(expectedTiers['dev-lg-6'] === 'silver' && expectedTiers['dev-lg-7'] === 'silver', 'zona do meio (fora das duas pontas) mantém o Tier');
  check(expectedTiers['dev-lg-8'] === 'bronze', 'fora da zona de promoção/permanência → desce de Tier');

  // Resolução é preguiçosa e idempotente: uma segunda chamada não recalcula
  // nem muda o Tier já persistido pra semana.
  const secondCall = JSON.parse(psql(`select public.get_league_leaderboard('dev-lg-1', '2026-08-31 12:00:00+00')`));
  check(secondCall.tier === 'gold', 'segunda consulta na mesma semana devolve o Tier já persistido, sem recalcular');

  // Cenário com MAIS de uma Divisão no mesmo Tier (o cenário acima só tinha
  // 13 dispositivos — uma Divisão só): 35 dispositivos no Tier 'gold' na
  // semana anterior formam 2 Divisões (ranks 1-30 = Divisão 1, de tamanho
  // cheio; ranks 31-35 = Divisão 2, com só 5). Prova que a zona de
  // subida/descida é por Divisão, não pelo Tier inteiro: dev-lgm-26 (fim da
  // Divisão 1) desce mesmo não estando entre os 5 piores do Tier inteiro (que
  // seriam os ranks 31-35, a Divisão 2); dev-lgm-31 (início da Divisão 2) sobe
  // mesmo estando entre os 5 piores ranks do Tier inteiro.
  const multiDivisionScores = Array.from({ length: 35 }, (_, i) => [`dev-lgm-${i + 1}`, 3500 - i * 100]);
  for (const [deviceId] of multiDivisionScores) {
    psql(`insert into public.league_placements (device_id, week, tier) values ('${deviceId}', '2026-08-24', 'gold')`);
  }
  psql(`
    insert into public.daily_submissions (day, device_id, score) values
    ${multiDivisionScores.map(([deviceId, score]) => `('2026-08-24', '${deviceId}', ${score})`).join(',\n    ')}
  `);
  psql(`
    insert into public.daily_submissions (day, device_id, score) values
    ${multiDivisionScores.map(([deviceId, score]) => `('2026-08-31', '${deviceId}', ${score})`).join(',\n    ')}
  `);
  const multiDivisionExpectations = [
    ['dev-lgm-1', 'platinum', 'topo da Divisão 1 (posição 1 de 30)'],
    ['dev-lgm-5', 'platinum', 'topo da Divisão 1 (posição 5 de 30)'],
    ['dev-lgm-15', 'gold', 'meio da Divisão 1 (posição 15 de 30) — mantém o Tier'],
    ['dev-lgm-26', 'silver', 'fim da Divisão 1 (posição 26 de 30) — desce mesmo não estando entre os 5 piores do Tier inteiro'],
    ['dev-lgm-30', 'silver', 'fim da Divisão 1 (posição 30 de 30)'],
    ['dev-lgm-31', 'platinum', 'início da Divisão 2 (posição 1 de 5) — sobe mesmo estando entre os 5 piores ranks do Tier inteiro'],
    ['dev-lgm-35', 'platinum', 'Divisão 2 é pequena demais (5, igual à zona) — promoção cobre a Divisão inteira'],
  ];
  for (const [deviceId, expectedTier, description] of multiDivisionExpectations) {
    const standing = JSON.parse(psql(`select public.get_league_leaderboard('${deviceId}', '2026-08-31 12:00:00+00')`));
    check(standing.tier === expectedTier, `${deviceId}: ${description} → Tier ${standing.tier} (esperado ${expectedTier})`);
  }

  check(psqlCommand(`set role anon; select public.get_league_leaderboard('anon-league-dev', '2026-08-31 12:00:00+00')`).startsWith('{'), 'anon consegue consultar a Liga (security definer)');
  let leaguePlacementsDirectDenied = false;
  try {
    psqlCommand(`set role anon; select * from public.league_placements`);
  } catch {
    leaguePlacementsDirectDenied = true;
  }
  check(leaguePlacementsDirectDenied, 'anon NÃO acessa league_placements diretamente (RLS sem políticas)');

  if (failures === 0) {
    console.log('\n✔ Contrato do Desafio Diário verificado contra Postgres real.');
  } else {
    console.error(`\n✘ ${failures} verificação(ões) falharam.`);
    process.exitCode = 1;
  }
} finally {
  dockerQuiet(['rm', '-f', CONTAINER]);
}
