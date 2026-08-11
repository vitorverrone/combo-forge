# 11 — Persistência e Meta-Progressão

**What to build:** A persistência real em SQLite (implementando o port de storage do DDA do ticket 07) e a Meta-Progressão: marcos por conquista (1ª, 3ª e 5ª Run vencida; recorde de ≥ 2.500 pontos numa Run), escolha da ordem de desbloqueio quando um marco oferece mais de uma opção, estatísticas de perfil (maior combo, taxa de vitória, cartas favoritas) e as telas Coleção e Perfil.

**Blocked by:** 07 — Motor: DDA e determinismo, 09 — Fim de Rodada e derrota

**Status:** done

- [x] O estado do DDA e as estatísticas de perfil persistem entre sessões via SQLite
- [x] Marcos de 1ª/3ª/5ª Run vencida e recorde ≥ 2.500 são detectados ao fim de cada Run
- [x] Desbloqueios aplicados: Martelo, Bigorna, novos Efeitos de Forja no pool de ofertas e Relíquias raras no pool
- [x] Quando um marco oferece mais de um desbloqueio, o jogador escolhe a ordem
- [x] Perfil mostra maior combo, taxa de vitória e cartas favoritas
- [x] Coleção lista cartas, Relíquias e Forjadores desbloqueados, com progresso visível
